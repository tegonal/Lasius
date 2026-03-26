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

import { data } from 'react-router'

import { ChartErrorBoundary } from '~/features/stats/components/error-boundary-chart'
import { StatsCircleCategoryRange } from '~/features/stats/components/stats-circle-category-range'
import { StatsProjectStream } from '~/features/stats/components/stats-project-stream'
import { statsClientLoader } from '~/features/stats/stats-loader'
import {
  loadStatsContext,
  statsResponseHeaders,
} from '~/features/stats/stats-loader.server'
import {
  getAdaptiveGranularity,
  shouldUseBarChart,
} from '~/lib/api/config/granularity-config'
import { getNivoChartDataFromApiStatsData } from '~/lib/api/functions/get-nivo-chart-data-from-api-stats-data'
import { getTransformedChartDataAggregate } from '~/lib/api/functions/get-transformed-chart-data-aggregate'
import { apiDatespanFromTo } from '~/lib/utils/dates'
import { getUserBookingAggregatedStatsByOrganisation } from '~/services/api/lasius/user-bookings/user-bookings'

import { type Route } from './+types/user.stats.projects'

// ─── Revalidation ────────────────────────────────────────────────────────────

// ─── Client Loader (cache unless full-page refresh) ──────────────────────────

export const clientLoader = async (args: Route.ClientLoaderArgs) =>
  statsClientLoader(args)
clientLoader.hydrate = false

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = async ({ request }: Route.LoaderArgs) => {
  const ctx = await loadStatsContext(request)
  const { from, headers, selectedOrgId, to } = ctx

  const granularity = getAdaptiveGranularity(from, to)
  const useBarChart = shouldUseBarChart(from, to)

  // Compute API params
  const datespan = apiDatespanFromTo(from, to)

  // Fetch project stats in parallel
  const [projectsByDayRes, projectsAggregatedRes] = await Promise.all([
    datespan
      ? getUserBookingAggregatedStatsByOrganisation(
          selectedOrgId,
          {
            from: datespan.from,
            granularity,
            source: 'project',
            to: datespan.to,
          },
          { headers },
        )
      : Promise.resolve({ data: [] }),
    datespan
      ? getUserBookingAggregatedStatsByOrganisation(
          selectedOrgId,
          {
            from: datespan.from,
            granularity: 'All',
            source: 'project',
            to: datespan.to,
          },
          { headers },
        )
      : Promise.resolve({ data: [] }),
  ])

  const projectsByDay = projectsByDayRes.data ?? []
  const projectsAggregated = projectsAggregatedRes.data ?? []

  // Transform data server-side
  const projectStreamChart = getNivoChartDataFromApiStatsData(
    projectsByDay,
    granularity,
  )
  const projectsAggregatedChart =
    getTransformedChartDataAggregate(projectsAggregated)

  return data(
    {
      projectsAggregatedChart,
      projectStreamChart,
      useBarChart,
    },
    { headers: statsResponseHeaders(ctx.auth) },
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

const UserStatsProjects = ({ loaderData }: Route.ComponentProps) => {
  const { projectsAggregatedChart, projectStreamChart, useBarChart } =
    loaderData

  return (
    <div className="px-6">
      <ChartErrorBoundary>
        <StatsCircleCategoryRange chartData={projectsAggregatedChart} />
        <div className="divider my-4" />
        <StatsProjectStream
          chartData={projectStreamChart}
          useBarChart={useBarChart}
        />
      </ChartErrorBoundary>
    </div>
  )
}

export default UserStatsProjects

export { statsShouldRevalidate as shouldRevalidate } from '~/features/stats/stats-loader'
