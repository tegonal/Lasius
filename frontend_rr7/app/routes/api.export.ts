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

import {
  getAdaptiveGranularity,
  type Granularity,
} from '~/lib/api/config/granularity-config'
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
import { authHeaders, requireUser } from '~/services/auth/auth-helpers.server'

const apiDateFormat = 'yyyy-MM-dd'

const formatDateParam = (dateStr: string): string => {
  const date = new Date(dateStr)
  if (!isValid(date)) return dateStr
  return format(startOfDay(date), apiDateFormat)
}

const formatDateParamEnd = (dateStr: string): string => {
  const date = new Date(dateStr)
  if (!isValid(date)) return dateStr
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
export async function loader({ request }: { request: Request }) {
  const auth = await requireUser(request)
  const headers = authHeaders(auth.session)

  const url = new URL(request.url)
  const type = url.searchParams.get('type')
  const formatParam = url.searchParams.get('format') as ExportFormat | null
  const orgId = url.searchParams.get('orgId')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  if (!type || !formatParam || !orgId || !from || !to) {
    return new Response('Missing required parameters', { status: 400 })
  }

  try {
    if (type === 'bookings') {
      return handleBookingsExport({
        context:
          (url.searchParams.get('context') as
            | 'organisation'
            | 'project'
            | 'user') ?? 'user',
        format: formatParam,
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
      return handleStatisticsExport({
        format: formatParam as 'ods' | 'xlsx',
        from,
        headers,
        orgId,
        scope:
          (url.searchParams.get('scope') as 'organisation' | 'user') ?? 'user',
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

async function handleBookingsExport(params: {
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
  const timespan = apiTimespanFromTo(params.from, params.to)
  if (!timespan) {
    return new Response('Invalid date range', { status: 400 })
  }

  const response =
    params.context === 'organisation'
      ? await getOrganisationBookingList(params.orgId, timespan, {
          headers: params.headers,
        })
      : await getUserBookingListByOrganisation(params.orgId, timespan, {
          headers: params.headers,
        })

  // Apply client-side filters (same logic as booking-history-layout)
  const tagFilters = params.tags
    ? params.tags.split(',').map((id) => ({ id, type: 'SimpleTag' as const }))
    : []
  let bookings = response.data
  bookings = filterModelsBookingListByTags(bookings, tagFilters)
  bookings = filterModelsBookingListProjectId(bookings, params.projectId)
  bookings = filterModelsBookingListUserId(bookings, params.userId)

  const { buffer, filename } = exportBookingList(bookings, params.format, {
    context: params.context,
    from: params.from,
    to: params.to,
  })

  return new Response(buffer as Uint8Array<ArrayBuffer>, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type':
        contentTypeMap[params.format] ?? 'application/octet-stream',
    },
  })
}

async function handleStatisticsExport(params: {
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
  const {
    format: exportFormat,
    from,
    headers: reqHeaders,
    orgId,
    scope,
    to,
  } = params
  const granularity = getAdaptiveGranularity(from, to)
  const apiFrom = formatDateParam(from)
  const apiTo = formatDateParamEnd(to)

  const fetchStats = (source: string, gran: 'All' | Granularity) => {
    const fetchParams = {
      from: apiFrom,
      granularity: gran,
      source,
      to: apiTo,
    }
    return scope === 'organisation'
      ? getOrganisationBookingAggregatedStats(orgId, fetchParams, {
          headers: reqHeaders,
        })
      : getUserBookingAggregatedStatsByOrganisation(orgId, fetchParams, {
          headers: reqHeaders,
        })
  }

  let byDayAndSource: { data: ModelsBookingStats[]; source: string }[]
  let aggregated: { data: ModelsBookingStats[]; source: string }[]

  if (scope === 'organisation') {
    const [tagsByDay, usersByDay, projectsAgg, usersAgg, tagsAgg] =
      await Promise.all([
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
      summary: { from, to, ...params.summary },
    },
    exportFormat,
  )

  return new Response(buffer as Uint8Array<ArrayBuffer>, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type':
        contentTypeMap[exportFormat] ?? 'application/octet-stream',
    },
  })
}
