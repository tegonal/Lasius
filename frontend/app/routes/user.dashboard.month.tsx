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

import { endOfMonth, format, startOfMonth } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { data } from 'react-router'

import { FormatDate } from '~/components/ui/data-display/format-date'
import { StatsOverviewGrid } from '~/features/dashboard/components/stats-overview-grid'
import { TopProjectsCard } from '~/features/dashboard/components/top-projects-card'
import { dashboardClientLoader } from '~/features/dashboard/dashboard-loader'
import {
  computeDashboardStats,
  dashboardResponseHeaders,
  loadDashboardContext,
} from '~/features/dashboard/dashboard-loader.server'
import { computeStreamChartData } from '~/features/dashboard/month-stream-chart-data'
import { MonthStreamChart } from '~/features/stats/components/month-stream-chart'
import { aggregateProjectHours } from '~/lib/api/functions/aggregate-project-hours'
import { getPlannedHoursForRange } from '~/lib/api/functions/get-planned-working-hours'
import { apiTimespanMonth } from '~/lib/utils/dates'
import {
  getUserBookingAggregatedStatsByOrganisation,
  getUserBookingListByOrganisation,
} from '~/services/api/lasius/user-bookings/user-bookings'

import { type Route } from './+types/user.dashboard.month'

// ─── Client Loader (cache unless full-page refresh) ──────────────────────────

export const clientLoader = async (arguments_: Route.ClientLoaderArgs) =>
  dashboardClientLoader(arguments_)
clientLoader.hydrate = false

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const context = await loadDashboardContext(request, url)
  const { headers, plannedHours, selectedDate, selectedOrgId } = context

  const monthTimespan = apiTimespanMonth(selectedDate)
  const dateObject = new Date(selectedDate)
  const monthStartDate = startOfMonth(dateObject)
  const monthEndDate = endOfMonth(dateObject)

  // Fetch month bookings and aggregated project stats in parallel
  const [monthBookingsResponse, projectStatsResponse] = await Promise.all([
    getUserBookingListByOrganisation(selectedOrgId, monthTimespan, {
      headers,
    }),
    getUserBookingAggregatedStatsByOrganisation(
      selectedOrgId,
      {
        from: format(monthStartDate, 'yyyy-MM-dd'),
        granularity: 'Day',
        source: 'project',
        to: format(monthEndDate, 'yyyy-MM-dd'),
      },
      { headers },
    ),
  ])

  const monthBookings = monthBookingsResponse.data ?? []
  const projectStats = projectStatsResponse.data ?? []

  // Compute month summary
  const expectedHours = getPlannedHoursForRange(monthStartDate, monthEndDate, plannedHours)
  const stats = computeDashboardStats(monthBookings, expectedHours)

  // Aggregate top projects
  const topProjects = aggregateProjectHours(projectStats, 5)

  // Compute stream chart data
  const streamChart = computeStreamChartData(monthBookings, selectedDate)

  return data(
    { selectedDate, stats, streamChart, topProjects },
    { headers: dashboardResponseHeaders(context.auth) },
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardMonth({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation('common')
  const { selectedDate, stats, streamChart, topProjects } = loaderData
  const dateObject = new Date(selectedDate)

  return (
    <div className="space-y-6 px-8 py-6">
      <h2 className="text-lg font-semibold">
        <FormatDate date={dateObject} format="monthNameLong" />{' '}
        <FormatDate date={dateObject} format="year" />
      </h2>
      <div className="flex gap-4">
        <StatsOverviewGrid {...stats} period="month" />
        <TopProjectsCard
          emptyMessage={t('stats:noProjectsForMonth', 'No projects for this month')}
          projects={topProjects}
        />
      </div>
      {streamChart.keys.length > 0 && (
        <>
          <h3 className="text-base font-semibold">
            {t('stats:weeklyHoursDistribution', 'Weekly Hours Distribution')}
          </h3>
          <MonthStreamChart data={streamChart.data} keys={streamChart.keys} />
        </>
      )}
    </div>
  )
}
