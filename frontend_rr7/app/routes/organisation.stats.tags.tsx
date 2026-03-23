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

import { type BarChartGroupMode } from '~/features/stats/components/bars-hours'
import { ChartErrorBoundary } from '~/features/stats/components/error-boundary-chart'
import { StatsBarsByAggregatedTags } from '~/features/stats/components/stats-bars-by-aggregated-tags'
import { StatsBarsBySource } from '~/features/stats/components/stats-bars-by-source'
import { getAdaptiveGranularity } from '~/lib/api/config/granularity-config'
import { getNivoChartDataFromApiStatsData } from '~/lib/api/functions/get-nivo-chart-data-from-api-stats-data'
import { getTransformedChartDataAggregate } from '~/lib/api/functions/get-transformed-chart-data-aggregate'
import { dateOptions } from '~/lib/utils/date/date-options'
import { apiDatespanFromTo } from '~/lib/utils/dates'
import { cachedServerLoader } from '~/lib/utils/loader-cache'
import { ModelsUserOrganisationRole } from '~/services/api/lasius/modelsUserOrganisationRole'
import { getOrganisationBookingAggregatedStats } from '~/services/api/lasius/organisation-bookings/organisation-bookings'
import { getUserProfile } from '~/services/api/lasius/user/user'
import {
  authHeaders,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/organisation.stats.tags'

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

  // Check admin role
  const selectedOrg = organisations.find(
    (o) => o.organisationReference.id === selectedOrgId,
  )
  const isAdmin =
    selectedOrg?.role === ModelsUserOrganisationRole.OrganisationAdministrator

  if (!isAdmin) {
    throw new Response('Forbidden', { status: 403 })
  }

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

  // Compute API params
  const datespan = apiDatespanFromTo(from, to)

  // Fetch tag stats in parallel
  const [tagsByDayRes, tagsAggregatedRes] = await Promise.all([
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

  const tagsByDay = tagsByDayRes.data ?? []
  const tagsAggregated = tagsAggregatedRes.data ?? []

  // Transform data server-side
  const tagsByDayChart = getNivoChartDataFromApiStatsData(
    tagsByDay,
    granularity,
  )
  const tagsAggregatedChart = getTransformedChartDataAggregate(tagsAggregated)

  return data(
    {
      tagsAggregatedChart,
      tagsByDayChart,
    },
    { headers: mergeAuthHeaders(auth) },
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

const OrgStatsTags = ({ loaderData }: Route.ComponentProps) => {
  const { tagsAggregatedChart, tagsByDayChart } = loaderData

  return (
    <div className="px-6">
      <ChartErrorBoundary>
        <StatsBarsBySource
          chartData={tagsByDayChart}
          groupMode={'stacked' as BarChartGroupMode}
        />
        <div className="divider my-4" />
        <StatsBarsByAggregatedTags chartData={tagsAggregatedChart} />
      </ChartErrorBoundary>
    </div>
  )
}

export default OrgStatsTags
