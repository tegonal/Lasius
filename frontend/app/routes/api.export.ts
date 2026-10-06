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

import { endOfDay, format, isValid, startOfDay } from 'date-fns'

import { getAdaptiveGranularity, type Granularity } from '~/lib/api/config/granularity-config'
import { filterModelsBookingListByTags } from '~/lib/api/functions/filter-models-booking-list-by-tags'
import { filterModelsBookingListProjectId } from '~/lib/api/functions/filter-models-booking-list-project-id'
import { filterModelsBookingListUserId } from '~/lib/api/functions/filter-models-booking-list-user-id'
import { logger } from '~/lib/logger'
import { exportBookingList, type ExportFormat } from '~/lib/utils/data/export'
import { apiTimespanFromTo } from '~/lib/utils/dates'
import { exportStatistics } from '~/lib/utils/statistics-export'
import { type ModelsBookingStats } from '~/services/api/lasius/modelsBookingStats'
import {
  getOrganisationBookingAggregatedStats,
  getOrganisationBookingList,
} from '~/services/api/lasius/organisation-bookings/organisation-bookings'
import {
  getUserBookingAggregatedStatsByOrganisation,
  getUserBookingListByOrganisation,
} from '~/services/api/lasius/user-bookings/user-bookings'
import { authHeaders, mergeAuthHeaders, requireUser } from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/api.export'

const apiDateFormat = 'yyyy-MM-dd'

const formatDateParameter = (dateString: string): string => {
  const date = new Date(dateString)
  if (!isValid(date)) return dateString
  return format(startOfDay(date), apiDateFormat)
}

const formatDateParameterEnd = (dateString: string): string => {
  const date = new Date(dateString)
  if (!isValid(date)) return dateString
  return format(endOfDay(date), apiDateFormat)
}

const contentTypeMap: Record<string, string> = {
  csv: 'text/csv',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

/**
 * GET /api/export
 *
 * Server-side spreadsheet generation. Fetches data from the backend API,
 * generates a spreadsheet file, and returns it as a download.
 *
 * Query params:
 *   type: 'bookings' | 'statistics'
 *   format: 'csv' | 'xlsx' | 'ods'
 *   orgId: string
 *   from: ISO date string
 *   to: ISO date string
 *   context: 'user' | 'project' | 'organisation' (bookings only, for filename)
 *   scope: 'user' | 'organisation' (statistics only)
 *   totalBookings, totalHours, totalProjects, totalUsers (statistics summary)
 */
export async function loader({ request, url }: Route.LoaderArgs) {
  const auth = await requireUser(request, url)
  const response = await createExportResponse(url, authHeaders(auth.session))

  const sessionCookie = mergeAuthHeaders(auth).get('Set-Cookie')
  if (sessionCookie) {
    response.headers.append('Set-Cookie', sessionCookie)
  }
  return response
}

async function createExportResponse(url: URL, headers: HeadersInit): Promise<Response> {
  const type = url.searchParams.get('type')
  const formatParameter = url.searchParams.get('format') as ExportFormat | null
  const orgId = url.searchParams.get('orgId')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  if (!type || !formatParameter || !orgId || !from || !to) {
    return new Response('Missing required parameters', { status: 400 })
  }

  try {
    if (type === 'bookings') {
      return await handleBookingsExport({
        context: (url.searchParams.get('context') as 'organisation' | 'project' | 'user') ?? 'user',
        format: formatParameter,
        from,
        headers,
        orgId,
        projectId: url.searchParams.get('projectId') ?? '',
        tags: url.searchParams.get('tags') ?? '',
        to,
        userId: url.searchParams.get('userId') ?? '',
      })
    }

    if (type === 'statistics') {
      return await handleStatisticsExport({
        format: formatParameter as 'ods' | 'xlsx',
        from,
        headers,
        orgId,
        scope: (url.searchParams.get('scope') as 'organisation' | 'user') ?? 'user',
        summary: {
          totalBookings: Number(url.searchParams.get('totalBookings') ?? 0),
          totalHours: Number(url.searchParams.get('totalHours') ?? 0),
          totalProjects: Number(url.searchParams.get('totalProjects') ?? 0),
          totalUsers: Number(url.searchParams.get('totalUsers') ?? 0),
        },
        to,
      })
    }

    return new Response('Invalid export type', { status: 400 })
  } catch (error) {
    logger.error('Export failed', error)
    return new Response('Export failed', { status: 500 })
  }
}

async function handleBookingsExport(parameters: {
  context: 'organisation' | 'project' | 'user'
  format: ExportFormat
  from: string
  headers: HeadersInit
  orgId: string
  projectId: string
  tags: string
  to: string
  userId: string
}) {
  const timespan = apiTimespanFromTo(parameters.from, parameters.to)
  if (!timespan) {
    return new Response('Invalid date range', { status: 400 })
  }

  const response =
    parameters.context === 'organisation'
      ? await getOrganisationBookingList(parameters.orgId, timespan, {
          headers: parameters.headers,
        })
      : await getUserBookingListByOrganisation(parameters.orgId, timespan, {
          headers: parameters.headers,
        })

  // Apply client-side filters (same logic as booking-history-layout)
  const tagFilters = parameters.tags
    ? parameters.tags.split(',').map((id) => ({ id, type: 'SimpleTag' as const }))
    : []
  let bookings = response.data
  bookings = filterModelsBookingListByTags(bookings, tagFilters)
  bookings = filterModelsBookingListProjectId(bookings, parameters.projectId)
  bookings = filterModelsBookingListUserId(bookings, parameters.userId)

  const { buffer, filename } = exportBookingList(bookings, parameters.format, {
    context: parameters.context,
    from: parameters.from,
    to: parameters.to,
  })

  return new Response(buffer as Uint8Array<ArrayBuffer>, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': contentTypeMap[parameters.format] ?? 'application/octet-stream',
    },
  })
}

async function handleStatisticsExport(parameters: {
  format: 'ods' | 'xlsx'
  from: string
  headers: HeadersInit
  orgId: string
  scope: 'organisation' | 'user'
  summary: {
    totalBookings: number
    totalHours: number
    totalProjects: number
    totalUsers: number
  }
  to: string
}) {
  const { format: exportFormat, from, headers: requestHeaders, orgId, scope, to } = parameters
  const granularity = getAdaptiveGranularity(from, to)
  const apiFrom = formatDateParameter(from)
  const apiTo = formatDateParameterEnd(to)

  const fetchStats = (source: string, gran: 'All' | Granularity) => {
    const fetchParameters = {
      from: apiFrom,
      granularity: gran,
      source,
      to: apiTo,
    }
    return scope === 'organisation'
      ? getOrganisationBookingAggregatedStats(orgId, fetchParameters, {
          headers: requestHeaders,
        })
      : getUserBookingAggregatedStatsByOrganisation(orgId, fetchParameters, {
          headers: requestHeaders,
        })
  }

  let byDayAndSource: { data: ModelsBookingStats[]; source: string }[]
  let aggregated: { data: ModelsBookingStats[]; source: string }[]

  if (scope === 'organisation') {
    const [tagsByDay, usersByDay, projectsAgg, usersAgg, tagsAgg] = await Promise.all([
      fetchStats('tag', granularity),
      fetchStats('user', granularity),
      fetchStats('project', 'All'),
      fetchStats('user', 'All'),
      fetchStats('tag', 'All'),
    ])

    byDayAndSource = [
      { data: tagsByDay.data, source: 'tag' },
      { data: usersByDay.data, source: 'user' },
    ]
    aggregated = [
      { data: projectsAgg.data, source: 'project' },
      { data: usersAgg.data, source: 'user' },
      { data: tagsAgg.data, source: 'tag' },
    ]
  } else {
    const [projectsByDay, tagsByDay, projectsAgg, tagsAgg] = await Promise.all([
      fetchStats('project', granularity),
      fetchStats('tag', granularity),
      fetchStats('project', 'All'),
      fetchStats('tag', 'All'),
    ])

    byDayAndSource = [
      { data: projectsByDay.data, source: 'project' },
      { data: tagsByDay.data, source: 'tag' },
    ]
    aggregated = [
      { data: projectsAgg.data, source: 'project' },
      { data: tagsAgg.data, source: 'tag' },
    ]
  }

  const { buffer, filename } = exportStatistics(
    {
      aggregated,
      byDayAndSource,
      scope,
      summary: { from, to, ...parameters.summary },
    },
    exportFormat,
  )

  return new Response(buffer as Uint8Array<ArrayBuffer>, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': contentTypeMap[exportFormat] ?? 'application/octet-stream',
    },
  })
}
