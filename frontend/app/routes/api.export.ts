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
import { z } from 'zod'

import { getAdaptiveGranularity, type Granularity } from '~/lib/api/config/granularity-config'
import { filterModelsBookingListByTags } from '~/lib/api/functions/filter-models-booking-list-by-tags'
import { filterModelsBookingListProjectId } from '~/lib/api/functions/filter-models-booking-list-project-id'
import { filterModelsBookingListUserId } from '~/lib/api/functions/filter-models-booking-list-user-id'
import { logger } from '~/lib/logger'
import { exportBookingList, type ExportFormat } from '~/lib/utils/data/export'
import { apiTimespanFromTo, toCalendarDay } from '~/lib/utils/dates'
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
  const date = toCalendarDay(dateString)
  if (!isValid(date)) return dateString
  return format(startOfDay(date), apiDateFormat)
}

const formatDateParameterEnd = (dateString: string): string => {
  const date = toCalendarDay(dateString)
  if (!isValid(date)) return dateString
  return format(endOfDay(date), apiDateFormat)
}

const contentTypeMap: Record<ExportFormat, string> = {
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

const requiredParameter = z.string().min(1)

const requiredParametersSchema = z.object({
  format: requiredParameter,
  from: requiredParameter,
  orgId: requiredParameter,
  to: requiredParameter,
  type: requiredParameter,
})

const totalParameter = z.coerce.number().default(0)

const exportParametersSchema = z.discriminatedUnion('type', [
  z.object({
    context: z.enum(['organisation', 'project', 'user']).default('user'),
    format: z.enum(['csv', 'ods', 'xlsx']),
    from: requiredParameter,
    orgId: requiredParameter,
    projectId: z.string().default(''),
    tags: z.string().default(''),
    to: requiredParameter,
    type: z.literal('bookings'),
    userId: z.string().default(''),
  }),
  z.object({
    // exportStatistics writes workbooks with several sheets, so it does not support CSV.
    format: z.enum(['ods', 'xlsx']),
    from: requiredParameter,
    orgId: requiredParameter,
    scope: z.enum(['organisation', 'user']).default('user'),
    to: requiredParameter,
    totalBookings: totalParameter,
    totalHours: totalParameter,
    totalProjects: totalParameter,
    totalUsers: totalParameter,
    type: z.literal('statistics'),
  }),
])

export type ParseExportParametersResult =
  { error: string; ok: false } | { ok: true; parameters: ExportParameters }
type BookingsExportParameters = Omit<Extract<ExportParameters, { type: 'bookings' }>, 'type'>
type ExportParameters = z.infer<typeof exportParametersSchema>

type StatisticsExportParameters = Omit<Extract<ExportParameters, { type: 'statistics' }>, 'type'>

/**
 * Validates the query of GET /api/export. An invalid query gets an error message for a 400 response.
 */
export const parseExportParameters = (
  searchParameters: URLSearchParams,
): ParseExportParametersResult => {
  const raw = Object.fromEntries(searchParameters)
  if (!requiredParametersSchema.safeParse(raw).success) {
    return { error: 'Missing required parameters', ok: false }
  }

  const result = exportParametersSchema.safeParse(raw)
  if (result.success) return { ok: true, parameters: result.data }

  const isInvalidType = result.error.issues.some((issue) => issue.path[0] === 'type')
  return { error: isInvalidType ? 'Invalid export type' : 'Invalid export parameters', ok: false }
}

export async function handleBookingsExport(
  parameters: BookingsExportParameters & { headers: HeadersInit },
) {
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
      'Content-Type': contentTypeMap[parameters.format],
    },
  })
}

async function createExportResponse(url: URL, headers: HeadersInit): Promise<Response> {
  const parsed = parseExportParameters(url.searchParams)
  if (!parsed.ok) {
    return new Response(parsed.error, { status: 400 })
  }

  const { parameters } = parsed
  try {
    return parameters.type === 'bookings'
      ? await handleBookingsExport({ ...parameters, headers })
      : await handleStatisticsExport({ ...parameters, headers })
  } catch (error) {
    logger.error('Export failed', error)
    return new Response('Export failed', { status: 500 })
  }
}

async function handleStatisticsExport(
  parameters: StatisticsExportParameters & { headers: HeadersInit },
) {
  const {
    format: exportFormat,
    from,
    headers: requestHeaders,
    orgId,
    scope,
    to,
    totalBookings,
    totalHours,
    totalProjects,
    totalUsers,
  } = parameters
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
      summary: { from, to, totalBookings, totalHours, totalProjects, totalUsers },
    },
    exportFormat,
  )

  return new Response(buffer as Uint8Array<ArrayBuffer>, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': contentTypeMap[exportFormat],
    },
  })
}
