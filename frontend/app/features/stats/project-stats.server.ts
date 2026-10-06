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

import { data, redirect } from 'react-router'

import {
  countDistinctUsers,
  findProjectInProfile,
  getProjectsPath,
  getProjectStatsView,
  getStatsSource,
  type ProjectStatsScope,
} from '~/features/stats/lib/project-stats'
import {
  loadOrgStatsContext,
  loadStatsContext,
  statsResponseHeaders,
} from '~/features/stats/stats-loader.server'
import {
  getAdaptiveGranularity,
  type Granularity,
  shouldUseBarChart,
} from '~/lib/api/config/granularity-config'
import { getModelsBookingSummary } from '~/lib/api/functions/get-models-booking-summary'
import { getNivoChartDataFromApiStatsData } from '~/lib/api/functions/get-nivo-chart-data-from-api-stats-data'
import { getTransformedChartDataAggregate } from '~/lib/api/functions/get-transformed-chart-data-aggregate'
import { apiDatespanFromTo, apiTimespanFromTo } from '~/lib/utils/dates'
import {
  getAggregatedStatisticsByProject,
  getProjectBookingList,
} from '~/services/api/lasius/project-bookings/project-bookings'

type ProjectDataRequest = {
  from: string
  granularity: Granularity
  headers: HeadersInit
  orgId: string
  projectId: string
  source: 'tag' | 'user'
  to: string
}

type ProjectStatsArguments = {
  params: { projectId?: string }
  request: Request
  url: URL
}

const fetchProjectData = async (request: ProjectDataRequest) => {
  const { from, granularity, headers, orgId, projectId, source, to } = request
  const timespan = apiTimespanFromTo(from, to)
  const datespan = apiDatespanFromTo(from, to)
  if (!timespan || !datespan) return { aggregated: [], bookings: [], byPeriod: [] }

  const range = { from: datespan.from, source, to: datespan.to }
  const [bookings, byPeriod, aggregated] = await Promise.all([
    getProjectBookingList(orgId, projectId, timespan, { headers }),
    getAggregatedStatisticsByProject(orgId, projectId, { ...range, granularity }, { headers }),
    getAggregatedStatisticsByProject(
      orgId,
      projectId,
      { ...range, granularity: 'All' },
      { headers },
    ),
  ])
  return { aggregated: aggregated.data, bookings: bookings.data, byPeriod: byPeriod.data }
}

export const loadProjectStats = async (
  scope: ProjectStatsScope,
  { params, request, url }: ProjectStatsArguments,
) => {
  const context =
    scope === 'organisation'
      ? await loadOrgStatsContext(request, url)
      : await loadStatsContext(request, url)
  const { auth, from, headers, organisations, selectedOrgId, to } = context

  // An organisation switch reloads this page with a project of the previous organisation.
  const project = findProjectInProfile(organisations, selectedOrgId, params.projectId ?? '')
  if (!project) {
    throw redirect(getProjectsPath(scope), { headers: statsResponseHeaders(auth) })
  }

  const view = getProjectStatsView(url.searchParams)
  const granularity = getAdaptiveGranularity(from, to)
  const { aggregated, bookings, byPeriod } = await fetchProjectData({
    from,
    granularity,
    headers,
    orgId: selectedOrgId,
    projectId: project.id,
    source: getStatsSource(view),
    to,
  })

  return data(
    {
      aggregatedChart: getTransformedChartDataAggregate(aggregated),
      bookingSummary: getModelsBookingSummary(bookings),
      byPeriodChart: getNivoChartDataFromApiStatsData(byPeriod, granularity),
      distinctUsers: countDistinctUsers(bookings),
      project,
      scope,
      useBarChart: shouldUseBarChart(from, to),
      view,
    },
    { headers: statsResponseHeaders(auth) },
  )
}
