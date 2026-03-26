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
import { useTranslation } from 'react-i18next'
import { data } from 'react-router'

import { StatsOverviewGrid } from '~/features/dashboard/components/stats-overview-grid'
import { TopProjectsCard } from '~/features/dashboard/components/top-projects-card'
import { dashboardClientLoader } from '~/features/dashboard/dashboard-loader'
import {
  computeDashboardStats,
  dashboardResponseHeaders,
  loadDashboardContext,
} from '~/features/dashboard/dashboard-loader.server'
import { WeeklyTrendChart } from '~/features/stats/components/weekly-trend-chart'
import { aggregateProjectHours } from '~/lib/api/functions/aggregate-project-hours'
import { computeWorkHealthMetrics } from '~/lib/api/functions/compute-work-health-metrics.server'
import {
  getPlannedHoursForRange,
  getWeeklyPlannedHours,
} from '~/lib/api/functions/get-planned-working-hours'
import { formatDateTimeToURLParam } from '~/lib/utils/dates'
import {
  getUserBookingAggregatedStatsByOrganisation,
  getUserBookingListByOrganisation,
} from '~/services/api/lasius/user-bookings/user-bookings'

import { type Route } from './+types/user.dashboard.6months'

// ─── Client Loader (cache unless full-page refresh) ──────────────────────────

export const clientLoader = async (args: Route.ClientLoaderArgs) =>
  dashboardClientLoader(args)
clientLoader.hydrate = false

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = async ({ request }: Route.LoaderArgs) => {
  const ctx = await loadDashboardContext(request)
  const { headers, plannedHours, selectedDate, selectedOrgId } = ctx

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
  const expectedHours = getPlannedHoursForRange(
    rangeStart,
    dateObj,
    plannedHours,
  )
  const stats = computeDashboardStats(bookings, expectedHours)

  // Aggregate top 5 projects
  const topProjects = aggregateProjectHours(projectStats, 5)

  return data(
    { selectedDate, stats, topProjects, weeklyData },
    { headers: dashboardResponseHeaders(ctx.auth) },
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dashboard6Months({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation('common')
  const { stats, topProjects, weeklyData } = loaderData

  return (
    <div className="space-y-6 px-8 py-6">
      <h2 className="text-lg font-semibold">
        {t('stats:6months', '6 Months')}
      </h2>
      <div className="flex gap-4">
        <StatsOverviewGrid {...stats} />
        <TopProjectsCard
          emptyMessage={t(
            'stats:noProjectsFor6Months',
            'No projects for this period',
          )}
          projects={topProjects}
        />
      </div>
      {weeklyData.length > 0 && (
        <>
          <h3 className="text-base font-semibold">
            {t('stats:6monthWorkTrend', '6-Month Work Trend')}
          </h3>
          <WeeklyTrendChart weeklyData={weeklyData} />
        </>
      )}
    </div>
  )
}
