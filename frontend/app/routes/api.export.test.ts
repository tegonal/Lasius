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

import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx'

import { type ModelsBooking } from '~/services/api/lasius'
import { getOrganisationBookingList } from '~/services/api/lasius/organisation-bookings/organisation-bookings'
import { getUserBookingListByOrganisation } from '~/services/api/lasius/user-bookings/user-bookings'

import { handleBookingsExport, parseExportParameters } from './api.export'

vi.mock('~/services/api/lasius/organisation-bookings/organisation-bookings', () => ({
  getOrganisationBookingAggregatedStats: vi.fn(),
  getOrganisationBookingList: vi.fn(),
}))
vi.mock('~/services/api/lasius/user-bookings/user-bookings', () => ({
  getUserBookingAggregatedStatsByOrganisation: vi.fn(),
  getUserBookingListByOrganisation: vi.fn(),
}))

const FROM = '2026-10-05T00:00:00.000+02:00'
const TO = '2026-10-05T23:59:59.999+02:00'

const required = { format: 'xlsx', from: FROM, orgId: 'o1', to: TO }

const parse = (query: Record<string, string>) => parseExportParameters(new URLSearchParams(query))

const makeBooking = (id: string, projectId: string, userId: string, tagIds: string[]) =>
  ({
    bookingHash: 0,
    end: { dateTime: '2026-10-05T11:00:00.000Z', zone: 'UTC' },
    id,
    organisationReference: { id: 'o1', key: 'org1' },
    projectReference: { id: projectId, key: projectId },
    start: { dateTime: '2026-10-05T10:00:00.000Z', zone: 'UTC' },
    tags: tagIds.map((tagId) => ({ id: tagId, type: 'SimpleTag' as const })),
    userReference: { id: userId, key: userId },
  }) satisfies ModelsBooking

const bookings = [
  makeBooking('b1', 'p1', 'u1', ['t1']),
  makeBooking('b2', 'p1', 'u2', ['t1', 't2']),
  makeBooking('b3', 'p2', 'u1', []),
]

const listResponse = { data: bookings, headers: new Headers(), status: 200 as const }

const bookingsParameters = {
  context: 'user' as const,
  format: 'xlsx' as const,
  from: FROM,
  headers: { Authorization: 'Bearer token' },
  orgId: 'o1',
  projectId: '',
  tags: '',
  to: TO,
  userId: '',
}

const readIds = async (response: Response) => {
  const wb = XLSX.read(new Uint8Array(await response.arrayBuffer()), { type: 'array' })
  const rows = XLSX.utils.sheet_to_json<{ user: string }>(wb.Sheets['Bookings']!)
  return rows.map((row) => row.user)
}

describe('parseExportParameters', () => {
  it.each(['type', 'format', 'orgId', 'from', 'to'])('rejects a query without %s', (key) => {
    const query: Record<string, string> = { ...required, type: 'bookings' }
    delete query[key]
    expect(parse(query)).toEqual({ error: 'Missing required parameters', ok: false })
  })

  it('rejects an empty required value', () => {
    expect(parse({ ...required, orgId: '', type: 'bookings' })).toEqual({
      error: 'Missing required parameters',
      ok: false,
    })
  })

  it('rejects an unknown type', () => {
    expect(parse({ ...required, type: 'invoices' })).toEqual({
      error: 'Invalid export type',
      ok: false,
    })
  })

  it('rejects an unknown format instead of writing ODS', () => {
    expect(parse({ ...required, format: 'pdf', type: 'bookings' })).toEqual({
      error: 'Invalid export parameters',
      ok: false,
    })
  })

  it('rejects CSV for statistics', () => {
    expect(parse({ ...required, format: 'csv', type: 'statistics' })).toEqual({
      error: 'Invalid export parameters',
      ok: false,
    })
  })

  it('rejects an unknown context and an unknown scope', () => {
    expect(parse({ ...required, context: 'team', type: 'bookings' }).ok).toBe(false)
    expect(parse({ ...required, scope: 'team', type: 'statistics' }).ok).toBe(false)
  })

  it('applies the bookings defaults', () => {
    expect(parse({ ...required, format: 'csv', type: 'bookings' })).toEqual({
      ok: true,
      parameters: {
        context: 'user',
        format: 'csv',
        from: FROM,
        orgId: 'o1',
        projectId: '',
        tags: '',
        to: TO,
        type: 'bookings',
        userId: '',
      },
    })
  })

  it('keeps the bookings filters', () => {
    const result = parse({
      ...required,
      context: 'organisation',
      projectId: 'p1',
      tags: 't1,t2',
      type: 'bookings',
      userId: 'u1',
    })
    expect(result).toMatchObject({
      ok: true,
      parameters: { context: 'organisation', projectId: 'p1', tags: 't1,t2', userId: 'u1' },
    })
  })

  it('applies the statistics defaults', () => {
    expect(parse({ ...required, format: 'ods', type: 'statistics' })).toEqual({
      ok: true,
      parameters: {
        format: 'ods',
        from: FROM,
        orgId: 'o1',
        scope: 'user',
        to: TO,
        totalBookings: 0,
        totalHours: 0,
        totalProjects: 0,
        totalUsers: 0,
        type: 'statistics',
      },
    })
  })

  it('converts the statistics totals to numbers', () => {
    const result = parse({
      ...required,
      scope: 'organisation',
      totalBookings: '12',
      totalHours: '7.5',
      type: 'statistics',
    })
    expect(result).toMatchObject({
      ok: true,
      parameters: { scope: 'organisation', totalBookings: 12, totalHours: 7.5 },
    })
  })
})

describe('handleBookingsExport', () => {
  beforeEach(() => {
    vi.mocked(getOrganisationBookingList).mockReset().mockResolvedValue(listResponse)
    vi.mocked(getUserBookingListByOrganisation).mockReset().mockResolvedValue(listResponse)
  })

  it('answers 400 for an invalid date range', async () => {
    const response = await handleBookingsExport({ ...bookingsParameters, from: 'not-a-date' })
    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Invalid date range')
    expect(getUserBookingListByOrganisation).not.toHaveBeenCalled()
  })

  it('loads the organisation list for the organisation context', async () => {
    await handleBookingsExport({ ...bookingsParameters, context: 'organisation' })
    expect(getOrganisationBookingList).toHaveBeenCalledWith('o1', expect.any(Object), {
      headers: bookingsParameters.headers,
    })
    expect(getUserBookingListByOrganisation).not.toHaveBeenCalled()
  })

  it.each(['user', 'project'] as const)(
    'loads the user list for the %s context',
    async (context) => {
      await handleBookingsExport({ ...bookingsParameters, context })
      expect(getUserBookingListByOrganisation).toHaveBeenCalledWith('o1', expect.any(Object), {
        headers: bookingsParameters.headers,
      })
      expect(getOrganisationBookingList).not.toHaveBeenCalled()
    },
  )

  it('exports every booking without filters', async () => {
    const response = await handleBookingsExport(bookingsParameters)
    expect(await readIds(response)).toEqual(['u1', 'u2', 'u1'])
  })

  it('applies the tag, project and user filters', async () => {
    const byTags = await handleBookingsExport({ ...bookingsParameters, tags: 't1,t2' })
    const byProject = await handleBookingsExport({ ...bookingsParameters, projectId: 'p2' })
    const byUser = await handleBookingsExport({ ...bookingsParameters, userId: 'u2' })

    expect(await readIds(byTags)).toEqual(['u2'])
    expect(await readIds(byProject)).toEqual(['u1'])
    expect(await readIds(byUser)).toEqual(['u2'])
  })

  it.each([
    ['csv', 'text/csv'],
    ['ods', 'application/vnd.oasis.opendocument.spreadsheet'],
    ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ] as const)('answers %s with the content type %s', async (format, contentType) => {
    const response = await handleBookingsExport({ ...bookingsParameters, format })
    expect(response.headers.get('Content-Type')).toBe(contentType)
    expect(response.headers.get('Content-Disposition')).toBe(
      `attachment; filename="lasius-user-bookings-2026-10-05.${format}"`,
    )
  })
})
