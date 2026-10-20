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

import { subWeeks } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { data } from 'react-router'

import { StatsOverviewGrid } from '~/features/dashboard/components/stats-overview-grid'
import { TopProjectsCard } from '~/features/dashboard/components/top-projects-card'
import { dashboardClientLoader } from '~/features/dashboard/dashboard-loader'
import {
  dashboardResponseHeaders,
  loadDashboardContext,
  loadWeeklyRangeDashboard,
} from '~/features/dashboard/dashboard-loader.server'
import { WeeklyTrendChart } from '~/features/stats/components/weekly-trend-chart'
import { toCalendarDay } from '~/lib/utils/dates'

import { type Route } from './+types/user.dashboard.6months'

// ─── Client Loader (cache unless full-page refresh) ──────────────────────────

export const clientLoader = async (arguments_: Route.ClientLoaderArgs) =>
  dashboardClientLoader('routes/user.dashboard.6months', arguments_)
clientLoader.hydrate = false

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const context = await loadDashboardContext(request, url)
  const { selectedDate } = context

  const dateObject = toCalendarDay(selectedDate)
  const { stats, topProjects, weeklyData } = await loadWeeklyRangeDashboard(context, {
    end: dateObject,
    start: subWeeks(dateObject, 26),
    weeks: 26,
  })

  return data(
    { selectedDate, stats, topProjects, weeklyData },
    { headers: dashboardResponseHeaders(context.auth) },
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dashboard6Months({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation('common')
  const { stats, topProjects, weeklyData } = loaderData

  return (
    <div className="@container space-y-6 px-4 py-6 sm:px-8">
      <h2 className="text-lg font-semibold">{t('stats:6months', '6 Months')}</h2>
      <div className="flex flex-col gap-4 @2xl:flex-row">
        <StatsOverviewGrid {...stats} />
        <TopProjectsCard
          emptyMessage={t('stats:noProjectsFor6Months', 'No projects for this period')}
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
