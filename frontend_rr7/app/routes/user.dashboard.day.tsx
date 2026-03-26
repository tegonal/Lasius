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

import { format } from 'date-fns'
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
import { aggregateProjectHours } from '~/lib/api/functions/aggregate-project-hours'
import { getPlannedHoursForDay } from '~/lib/api/functions/get-planned-working-hours'
import { apiTimespanDay } from '~/lib/utils/dates'
import {
  getUserBookingAggregatedStatsByOrganisation,
  getUserBookingListByOrganisation,
} from '~/services/api/lasius/user-bookings/user-bookings'

import { type Route } from './+types/user.dashboard.day'

// ─── Client Loader (cache unless full-page refresh) ──────────────────────────

export const clientLoader = async (args: Route.ClientLoaderArgs) =>
  dashboardClientLoader(args)
clientLoader.hydrate = false

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = async ({ request }: Route.LoaderArgs) => {
  const ctx = await loadDashboardContext(request)
  const { headers, plannedHours, selectedDate, selectedOrgId } = ctx

  const dayTimespan = apiTimespanDay(selectedDate)
  const dateObj = new Date(selectedDate)
  const dayDate = format(dateObj, 'yyyy-MM-dd')

  // Fetch day bookings and aggregated project stats in parallel
  const [dayBookingsRes, projectStatsRes] = await Promise.all([
    getUserBookingListByOrganisation(selectedOrgId, dayTimespan, {
      headers,
    }),
    getUserBookingAggregatedStatsByOrganisation(
      selectedOrgId,
      {
        from: dayDate,
        granularity: 'Day',
        source: 'project',
        to: dayDate,
      },
      { headers },
    ),
  ])

  const dayBookings = dayBookingsRes.data ?? []
  const projectStats = projectStatsRes.data ?? []

  // Compute day summary
  const expectedHours = getPlannedHoursForDay(dateObj, plannedHours)
  const stats = computeDashboardStats(dayBookings, expectedHours)

  // Aggregate ALL projects (day shows all, no topN limit)
  const projects = aggregateProjectHours(projectStats)

  return data(
    { projects, selectedDate, stats },
    { headers: dashboardResponseHeaders(ctx.auth) },
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardDay({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation('common')
  const { projects, selectedDate, stats } = loaderData
  const dateObj = new Date(selectedDate)

  return (
    <div className="space-y-6 px-8 py-6">
      <h2 className="text-lg font-semibold">
        <FormatDate date={dateObj} format="fullDateShort" />
      </h2>
      <div className="flex gap-4">
        <StatsOverviewGrid {...stats} period="day" />
        <TopProjectsCard
          emptyMessage={t('stats:noProjectsForDay', 'No projects for this day')}
          projects={projects}
          showTopPrefix={false}
        />
      </div>
    </div>
  )
}
