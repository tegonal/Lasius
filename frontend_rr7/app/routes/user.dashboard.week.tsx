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

import { endOfWeek, format, getWeek, startOfWeek } from 'date-fns'
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
import { aggregateProjectHours } from '~/lib/api/functions/aggregate-project-hours'
import { getPlannedHoursForRange } from '~/lib/api/functions/get-planned-working-hours'
import { apiTimespanWeek } from '~/lib/utils/dates'
import {
  getUserBookingAggregatedStatsByOrganisation,
  getUserBookingListByOrganisation,
} from '~/services/api/lasius/user-bookings/user-bookings'

import { type Route } from './+types/user.dashboard.week'

// ─── Client Loader (cache unless full-page refresh) ──────────────────────────

export const clientLoader = async (args: Route.ClientLoaderArgs) =>
  dashboardClientLoader(args)
clientLoader.hydrate = false

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = async ({ request }: Route.LoaderArgs) => {
  const ctx = await loadDashboardContext(request)
  const { headers, plannedHours, selectedDate, selectedOrgId } = ctx

  const weekTimespan = apiTimespanWeek(selectedDate)
  const dateObj = new Date(selectedDate)
  const weekStartDate = startOfWeek(dateObj, { weekStartsOn: 1 })
  const weekEndDate = endOfWeek(dateObj, { weekStartsOn: 1 })

  // Fetch week bookings and aggregated project stats in parallel
  const [weekBookingsRes, projectStatsRes] = await Promise.all([
    getUserBookingListByOrganisation(selectedOrgId, weekTimespan, {
      headers,
    }),
    getUserBookingAggregatedStatsByOrganisation(
      selectedOrgId,
      {
        from: format(weekStartDate, 'yyyy-MM-dd'),
        granularity: 'Day',
        source: 'project',
        to: format(weekEndDate, 'yyyy-MM-dd'),
      },
      { headers },
    ),
  ])

  const weekBookings = weekBookingsRes.data ?? []
  const projectStats = projectStatsRes.data ?? []

  // Compute week summary
  const expectedHours = getPlannedHoursForRange(
    weekStartDate,
    weekEndDate,
    plannedHours,
  )
  const stats = computeDashboardStats(weekBookings, expectedHours)

  // Aggregate top 5 projects
  const topProjects = aggregateProjectHours(projectStats, 5)

  // Get week number
  const weekNumber = getWeek(dateObj, { weekStartsOn: 1 })

  return data(
    { selectedDate, stats, topProjects, weekNumber },
    { headers: dashboardResponseHeaders(ctx.auth) },
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardWeek({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation('common')
  const { stats, topProjects, weekNumber } = loaderData

  return (
    <div className="space-y-6 px-8 py-6">
      <h2 className="text-lg font-semibold">
        {t('time.week', 'Week')} {weekNumber}
      </h2>
      <div className="flex gap-4">
        <StatsOverviewGrid {...stats} period="week" />
        <TopProjectsCard
          emptyMessage={t(
            'stats:noProjectsForWeek',
            'No projects for this week',
          )}
          projects={topProjects}
        />
      </div>
    </div>
  )
}
