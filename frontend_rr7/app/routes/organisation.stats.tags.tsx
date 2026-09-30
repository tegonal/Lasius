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
import { StatsBarsByAggregatedTags } from '~/features/stats/components/stats-bars-by-aggregated-tags'
import { StatsBarsBySource } from '~/features/stats/components/stats-bars-by-source'
import { statsClientLoader } from '~/features/stats/stats-loader'
import { loadOrgStatsContext, statsResponseHeaders } from '~/features/stats/stats-loader.server'
import { getAdaptiveGranularity } from '~/lib/api/config/granularity-config'
import { getNivoChartDataFromApiStatsData } from '~/lib/api/functions/get-nivo-chart-data-from-api-stats-data'
import { getTransformedChartDataAggregate } from '~/lib/api/functions/get-transformed-chart-data-aggregate'
import { apiDatespanFromTo } from '~/lib/utils/dates'
import { getOrganisationBookingAggregatedStats } from '~/services/api/lasius/organisation-bookings/organisation-bookings'

import { type Route } from './+types/organisation.stats.tags'

// ─── Revalidation ────────────────────────────────────────────────────────────

// ─── Client Loader (cache unless full-page refresh) ──────────────────────────

export const clientLoader = async (arguments_: Route.ClientLoaderArgs) =>
  statsClientLoader(arguments_)
clientLoader.hydrate = false

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const context = await loadOrgStatsContext(request, url)
  const { from, headers, selectedOrgId, to } = context

  const granularity = getAdaptiveGranularity(from, to)

  // Compute API params
  const datespan = apiDatespanFromTo(from, to)

  // Fetch tag stats in parallel
  const [tagsByDayResponse, tagsAggregatedResponse] = await Promise.all([
    datespan
      ? getOrganisationBookingAggregatedStats(
          selectedOrgId,
          {
            from: datespan.from,
            granularity,
            source: 'tag',
            to: datespan.to,
          },
          { headers },
        )
      : Promise.resolve({ data: [] }),
    datespan
      ? getOrganisationBookingAggregatedStats(
          selectedOrgId,
          {
            from: datespan.from,
            granularity: 'All',
            source: 'tag',
            to: datespan.to,
          },
          { headers },
        )
      : Promise.resolve({ data: [] }),
  ])

  const tagsByDay = tagsByDayResponse.data ?? []
  const tagsAggregated = tagsAggregatedResponse.data ?? []

  // Transform data server-side
  const tagsByDayChart = getNivoChartDataFromApiStatsData(tagsByDay, granularity)
  const tagsAggregatedChart = getTransformedChartDataAggregate(tagsAggregated)

  return data(
    {
      tagsAggregatedChart,
      tagsByDayChart,
    },
    { headers: statsResponseHeaders(context.auth) },
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

const OrgStatsTags = ({ loaderData }: Route.ComponentProps) => {
  const { tagsAggregatedChart, tagsByDayChart } = loaderData

  return (
    <div className="px-6">
      <ChartErrorBoundary>
        <StatsBarsBySource chartData={tagsByDayChart} groupMode="stacked" />
        <div className="divider my-4" />
        <StatsBarsByAggregatedTags chartData={tagsAggregatedChart} />
      </ChartErrorBoundary>
    </div>
  )
}

export default OrgStatsTags

export { statsShouldRevalidate as shouldRevalidate } from '~/features/stats/stats-loader'
