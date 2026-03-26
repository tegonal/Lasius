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

import {
  differenceInWeeks,
  endOfYear,
  format,
  min,
  startOfYear,
  subWeeks,
} from 'date-fns'
import { useTranslation } from 'react-i18next'
import { data, useSearchParams } from 'react-router'

import { FormatDate } from '~/components/ui/data-display/format-date'
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

import { type Route } from './+types/user.dashboard.year'

// ─── Client Loader (cache unless full-page refresh) ──────────────────────────

export const clientLoader = async (args: Route.ClientLoaderArgs) =>
  dashboardClientLoader(args)
clientLoader.hydrate = false

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = async ({ request }: Route.LoaderArgs) => {
  const ctx = await loadDashboardContext(request)
  const { headers, plannedHours, selectedDate, selectedOrgId, url } = ctx

  const yearMode = url.searchParams.get('year') || 'rolling'
  const isCalendarYear = yearMode === 'calendar'

  const dateObj = new Date(selectedDate)
  const today = new Date()

  // Compute date range based on year mode
  let rangeStart: Date
  let rangeEnd: Date

  if (isCalendarYear) {
    rangeStart = startOfYear(dateObj)
    rangeEnd = min([endOfYear(dateObj), today])
  } else {
    rangeStart = subWeeks(dateObj, 52)
    rangeEnd = dateObj
  }

  const weeksCount = differenceInWeeks(rangeEnd, rangeStart) + 1

  // Build timespan for the range
  const timespan = {
    from: formatDateTimeToURLParam(rangeStart),
    to: formatDateTimeToURLParam(rangeEnd),
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
        to: format(rangeEnd, 'yyyy-MM-dd'),
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
    weeksCount,
    selectedDate,
  )

  // Compute summary stats
  const expectedHours = getPlannedHoursForRange(
    rangeStart,
    rangeEnd,
    plannedHours,
  )
  const stats = computeDashboardStats(bookings, expectedHours)

  // Aggregate top 5 projects
  const topProjects = aggregateProjectHours(projectStats, 5)

  return data(
    { isCalendarYear, selectedDate, stats, topProjects, weeklyData },
    { headers: dashboardResponseHeaders(ctx.auth) },
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardYear({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation('common')
  const [, setSearchParams] = useSearchParams()
  const { isCalendarYear, selectedDate, stats, topProjects, weeklyData } =
    loaderData
  const dateObj = new Date(selectedDate)

  const toggleCalendarYear = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (isCalendarYear) {
        next.delete('year')
      } else {
        next.set('year', 'calendar')
      }
      return next
    })
  }

  return (
    <div className="space-y-6 px-8 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {isCalendarYear ? (
            <FormatDate date={dateObj} format="year" />
          ) : (
            t('stats:rolling12Months', 'Rolling 12 Months')
          )}
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-base-content/60">
            {t('stats:calendarYear', 'Calendar year')}
          </span>
          <input
            checked={isCalendarYear}
            className="toggle toggle-sm"
            data-testid="dashboard-year-toggle"
            onChange={toggleCalendarYear}
            type="checkbox"
          />
        </label>
      </div>
      <div className="flex gap-4">
        <StatsOverviewGrid {...stats} />
        <TopProjectsCard
          emptyMessage={t(
            'stats:noProjectsForYear',
            'No projects for this period',
          )}
          projects={topProjects}
        />
      </div>
      {weeklyData.length > 0 && (
        <>
          <h3 className="text-base font-semibold">
            {isCalendarYear
              ? t('stats:yearWorkTrend', 'Yearly Work Trend')
              : t('stats:rolling12MonthsTrend', '12-Month Work Trend')}
          </h3>
          <WeeklyTrendChart tickEvery={4} weeklyData={weeklyData} />
        </>
      )}
    </div>
  )
}
