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

import { afterEach, describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx'

import { type ModelsBooking } from '~/services/api/lasius'

import { computeColumnWidths, exportBookingList, generateExportFilename } from './export'

const booking: ModelsBooking = {
  bookingHash: 0,
  end: { dateTime: '2026-10-05T11:30:00.000Z', zone: 'UTC' },
  id: 'b1',
  organisationReference: { id: 'o1', key: 'org1' },
  projectReference: { id: 'p1', key: 'proj1' },
  start: { dateTime: '2026-10-05T10:00:00.000Z', zone: 'UTC' },
  tags: [
    { id: 'tag1', type: 'SimpleTag' },
    { id: 'tag2', type: 'SimpleTag' },
  ],
  userReference: { id: 'u1', key: 'user1' },
}

describe('generateExportFilename', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('uses today without options', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 7, 12, 0))
    expect(generateExportFilename('xlsx')).toBe('lasius-bookings-2026-10-07.xlsx')
  })

  it('adds the context and the context name', () => {
    expect(
      generateExportFilename('csv', {
        context: 'project',
        contextName: 'website',
        from: '2026-10-05T00:00:00.000+02:00',
        to: '2026-10-05T23:59:59.999+02:00',
      }),
    ).toBe('lasius-project-bookings-website-2026-10-05.csv')
  })

  it('uses one date for a single day', () => {
    expect(
      generateExportFilename('ods', {
        from: '2026-10-05T00:00:00.000+02:00',
        to: '2026-10-05T23:59:59.999+02:00',
      }),
    ).toBe('lasius-bookings-2026-10-05.ods')
  })

  it('uses both dates for two days', () => {
    expect(
      generateExportFilename('ods', {
        from: '2026-10-05T00:00:00.000+02:00',
        to: '2026-10-06T23:59:59.999+02:00',
      }),
    ).toBe('lasius-bookings-2026-10-05-to-2026-10-06.ods')
  })

  it('uses both dates for a week', () => {
    expect(
      generateExportFilename('xlsx', {
        context: 'user',
        from: '2026-10-05T00:00:00.000+02:00',
        to: '2026-10-11T23:59:59.999+02:00',
      }),
    ).toBe('lasius-user-bookings-2026-10-05-to-2026-10-11.xlsx')
  })
})

describe('computeColumnWidths', () => {
  it('returns no columns for no rows', () => {
    expect(computeColumnWidths([])).toEqual([])
  })

  it('uses the header when the header is longer', () => {
    expect(computeColumnWidths([{ project: 'a' }])).toEqual([{ wch: 9 }])
  })

  it('uses the longest value when a value is longer', () => {
    expect(computeColumnWidths([{ id: 'abc' }, { id: 'abcdef' }, { id: 'a' }])).toEqual([
      { wch: 8 },
    ])
  })

  it('caps the width at 50', () => {
    expect(computeColumnWidths([{ tags: 'x'.repeat(80) }])).toEqual([{ wch: 50 }])
  })

  it('counts a numeric 0 as one character', () => {
    expect(computeColumnWidths([{ n: 0 }])).toEqual([{ wch: 3 }])
  })

  it('returns one width per key in key order', () => {
    expect(computeColumnWidths([{ a: 'xxxx', bb: 1 }])).toEqual([{ wch: 6 }, { wch: 4 }])
  })
})

describe('exportBookingList', () => {
  it('writes a sheet with no rows for an empty list', () => {
    const { buffer } = exportBookingList([], 'xlsx')
    const wb = XLSX.read(buffer, { type: 'array' })
    const rows = XLSX.utils.sheet_to_json(wb.Sheets['Bookings']!)
    expect(wb.SheetNames).toEqual(['Bookings'])
    expect(rows).toEqual([])
  })

  it('writes one row with the duration as an [h]:mm day fraction', () => {
    const { buffer } = exportBookingList([booking], 'xlsx')
    const wb = XLSX.read(buffer, { cellNF: true, type: 'array' })
    const ws = wb.Sheets['Bookings']!
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      durationString: '01:30',
      organisation: 'org1',
      project: 'proj1',
      tags: 'tag1,tag2',
      user: 'user1',
    })
    expect(ws['A2']?.v).toBeCloseTo(1.5 / 24)
    expect(ws['A2']?.z).toBe('[h]:mm')
  })

  it('writes a CSV with a header line and one data line', () => {
    const { buffer, filename } = exportBookingList([booking], 'csv', {
      from: '2026-10-05T00:00:00.000+02:00',
      to: '2026-10-05T23:59:59.999+02:00',
    })
    const lines = new TextDecoder().decode(buffer).trim().split('\n')

    expect(filename).toBe('lasius-bookings-2026-10-05.csv')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe('duration,durationString,end,organisation,project,start,tags,user')
  })

  it('passes the options through to the filename', () => {
    const { filename } = exportBookingList([booking], 'ods', {
      context: 'organisation',
      from: '2026-10-01T00:00:00.000+02:00',
      to: '2026-10-31T23:59:59.999+02:00',
    })
    expect(filename).toBe('lasius-organisation-bookings-2026-10-01-to-2026-10-31.ods')
  })
})
