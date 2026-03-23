/**
 * Lasius - Open source time tracker for teams
 * Copyright (c) Tegonal Genossenschaft (https://tegonal.com)
 *
 * This file is part of Lasius.
 *
 * Lasius is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * Lasius is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Lasius.
 * If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { format, subWeeks } from 'date-fns'
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { data } from 'react-router'

import { StatsOverviewGrid } from '~/features/dashboard/components/stats-overview-grid'
import { TopProjectsCard } from '~/features/dashboard/components/top-projects-card'
import { aggregateProjectHours } from '~/lib/api/functions/aggregate-project-hours'
import { computeWorkHealthMetrics } from '~/lib/api/functions/compute-work-health-metrics.server'
import { getExpectedVsBookedPercentage } from '~/lib/api/functions/get-expected-vs-booked-percentage'
import { getModelsBookingSummary } from '~/lib/api/functions/get-models-booking-summary'
import {
  getPlannedHoursForRange,
  getWeeklyPlannedHours,
} from '~/lib/api/functions/get-planned-working-hours'
import { formatDateTimeToURLParam, formatISOLocale } from '~/lib/utils/dates'
import { cachedServerLoader } from '~/lib/utils/loader-cache'
import {
  getUserBookingAggregatedStatsByOrganisation,
  getUserBookingListByOrganisation,
} from '~/services/api/lasius/user-bookings/user-bookings'
import { getUserProfile } from '~/services/api/lasius/user/user'
import {
  authHeaders,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/dashboard.6months'

const WeeklyTrendChart = lazy(() =>
  import('~/features/stats/components/weekly-trend-chart').then((mod) => ({
    default: mod.WeeklyTrendChart,
  })),
)

// ─── Client Loader (cache unless full-page refresh) ──────────────────────────

export const clientLoader = async ({
  request,
  serverLoader,
}: Route.ClientLoaderArgs) => cachedServerLoader(request, serverLoader)
clientLoader.hydrate = false

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = async ({ request }: Route.LoaderArgs) => {
  const auth = await requireUser(request)
  const headers = authHeaders(auth.session)

  const profile = await getUserProfile({ headers })
  const user = profile.data

  // Determine selected org
  const organisations = user.organisations ?? []
  const selectedOrgId =
    user.settings?.lastSelectedOrganisation?.id ??
    organisations.find((o) => o.private)?.organisationReference.id ??
    organisations[0]?.organisationReference.id ??
    ''

  // Extract planned working hours for the selected org
  const selectedOrg = organisations.find(
    (o) => o.organisationReference.id === selectedOrgId,
  )
  const plannedHours = selectedOrg?.plannedWorkingHours
    ? { ...selectedOrg.plannedWorkingHours }
    : null

  // Read selected date from URL search param, fall back to today
  const url = new URL(request.url)
  const dateParam = url.searchParams.get('date')
  const selectedDate =
    dateParam && !isNaN(new Date(dateParam).getTime())
      ? dateParam
      : formatISOLocale(new Date())

  const dateObj = new Date(selectedDate)
  const rangeStart = subWeeks(dateObj, 26)

  // Build timespan for 26-week range
  const timespan = {
    from: formatDateTimeToURLParam(rangeStart),
    to: formatDateTimeToURLParam(dateObj),
  }

  // Fetch bookings and aggregated project stats in parallel
  const [bookingsRes, projectStatsRes] = await Promise.all([
    getUserBookingListByOrganisation(selectedOrgId, timespan, {
      headers,
    }),
    getUserBookingAggregatedStatsByOrganisation(
      selectedOrgId,
      {
        from: format(rangeStart, 'yyyy-MM-dd'),
        granularity: 'Week',
        source: 'project',
        to: format(dateObj, 'yyyy-MM-dd'),
      },
      { headers },
    ),
  ])

  const bookings = bookingsRes.data ?? []
  const projectStats = projectStatsRes.data ?? []

  // Compute work health metrics
  const weeklyPlannedHours = getWeeklyPlannedHours(plannedHours)
  const { weeklyData } = computeWorkHealthMetrics(
    bookings,
    weeklyPlannedHours,
    26,
    selectedDate,
  )

  // Compute summary stats
  const summary = getModelsBookingSummary(bookings)
  const expectedHours = getPlannedHoursForRange(
    rangeStart,
    dateObj,
    plannedHours,
  )
  const { fulfilledPercentage } = getExpectedVsBookedPercentage(
    expectedHours,
    summary.hours,
  )

  // Aggregate top 5 projects
  const topProjects = aggregateProjectHours(projectStats, 5)

  return data(
    {
      selectedDate,
      stats: {
        bookings: summary.elements,
        expectedHours,
        fulfilledPercentage,
        hours: summary.hours,
      },
      topProjects,
      weeklyData,
    },
    { headers: mergeAuthHeaders(auth) },
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dashboard6Months({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation('common')
  const { stats, topProjects, weeklyData } = loaderData

  return (
    <div className="space-y-6 px-8 py-6">
      <h2 className="text-lg font-semibold">
        {t('statistics.6months', { defaultValue: '6 Months' })}
      </h2>
      <div className="flex gap-4">
        <StatsOverviewGrid {...stats} />
        <TopProjectsCard
          emptyMessage={t('statistics.noProjectsFor6Months', {
            defaultValue: 'No projects for this period',
          })}
          projects={topProjects}
        />
      </div>
      {weeklyData.length > 0 && (
        <>
          <h3 className="text-base font-semibold">
            {t('statistics.6monthWorkTrend', {
              defaultValue: '6-Month Work Trend',
            })}
          </h3>
          <Suspense
            fallback={
              <div className="bg-base-200 h-64 w-full animate-pulse rounded" />
            }
          >
            <WeeklyTrendChart weeklyData={weeklyData} />
          </Suspense>
        </>
      )}
    </div>
  )
}
