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

import { data, type ShouldRevalidateFunctionArgs } from 'react-router'

import { ChartErrorBoundary } from '~/features/stats/components/error-boundary-chart'
import { StatsCircleCategoryRange } from '~/features/stats/components/stats-circle-category-range'
import { StatsProjectStream } from '~/features/stats/components/stats-project-stream'
import {
  getAdaptiveGranularity,
  shouldUseBarChart,
} from '~/lib/api/config/granularity-config'
import { getNivoChartDataFromApiStatsData } from '~/lib/api/functions/get-nivo-chart-data-from-api-stats-data'
import { getTransformedChartDataAggregate } from '~/lib/api/functions/get-transformed-chart-data-aggregate'
import { dateOptions } from '~/lib/utils/date/date-options'
import { apiDatespanFromTo } from '~/lib/utils/dates'
import { cachedServerLoader } from '~/lib/utils/loader-cache'
import { getUserBookingAggregatedStatsByOrganisation } from '~/services/api/lasius/user-bookings/user-bookings'
import { getUserProfile } from '~/services/api/lasius/user/user'
import {
  authHeaders,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/user.stats.projects'

// ─── Revalidation ────────────────────────────────────────────────────────────

/** Only revalidate when date range search params change */
export const shouldRevalidate = ({
  currentUrl,
  defaultShouldRevalidate,
  formMethod,
  nextUrl,
}: ShouldRevalidateFunctionArgs) => {
  if (formMethod) return defaultShouldRevalidate
  const currentFrom = currentUrl.searchParams.get('from')
  const currentTo = currentUrl.searchParams.get('to')
  const currentDateRange = currentUrl.searchParams.get('dateRange')
  const nextFrom = nextUrl.searchParams.get('from')
  const nextTo = nextUrl.searchParams.get('to')
  const nextDateRange = nextUrl.searchParams.get('dateRange')
  if (
    currentFrom === nextFrom &&
    currentTo === nextTo &&
    currentDateRange === nextDateRange
  ) {
    return false
  }
  return defaultShouldRevalidate
}

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

  // Read date range from URL search params or compute defaults
  const url = new URL(request.url)
  let from = url.searchParams.get('from')
  let to = url.searchParams.get('to')

  if (!from || !to) {
    const defaultRange = dateOptions[0]?.dateRangeFn(new Date())
    from = defaultRange?.from ?? ''
    to = defaultRange?.to ?? ''
  }

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
    { headers: mergeAuthHeaders(auth) },
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
