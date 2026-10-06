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

import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'

import { type ModelsBookingStats } from '~/services/api/lasius'

import { exportStatistics, type StatisticsExportData } from './statistics-export'

const HOUR = 60 * 60 * 1000

const stat = (
  category: ModelsBookingStats['category'],
  values: { duration: number; label: string }[],
) => ({ category, values }) as unknown as ModelsBookingStats

const baseData = (overrides: Partial<StatisticsExportData> = {}): StatisticsExportData => ({
  aggregated: [],
  byDayAndSource: [],
  scope: 'user',
  summary: {
    from: '2026-03-01T00:00:00.000',
    to: '2026-03-31T23:59:59.999',
    totalBookings: 12,
    totalHours: 34.5,
  },
  ...overrides,
})

const exportAndRead = (data: StatisticsExportData) => {
  const { buffer } = exportStatistics(data, 'xlsx')
  return XLSX.read(buffer, { type: 'array' })
}
const rows = (workbook: XLSX.WorkBook, sheet: string) =>
  XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheet]!, { header: 1 })

describe('exportStatistics', () => {
  it('names the file after the scope, the range and the format', () => {
    expect(exportStatistics(baseData(), 'xlsx').filename).toBe(
      'lasius-statistics-user-2026-03-01_to_2026-03-31.xlsx',
    )
    expect(exportStatistics(baseData({ scope: 'organisation' }), 'ods').filename).toBe(
      'lasius-statistics-organisation-2026-03-01_to_2026-03-31.ods',
    )
  })

  it('writes a summary sheet and adds user and project totals only when above zero', () => {
    const plain = exportAndRead(baseData())
    expect(plain.SheetNames).toEqual(['Summary'])
    expect(rows(plain, 'Summary')).toEqual([
      ['Time Period', '01.03.2026 to 31.03.2026'],
      ['Total Hours', 34.5],
      ['Total Bookings', 12],
    ])

    const summary = { ...baseData().summary, totalProjects: 0, totalUsers: 3 }
    const withTotals = exportAndRead(baseData({ summary }))
    expect(rows(withTotals, 'Summary').at(-1)).toEqual(['Total Users', 3])
    expect(rows(withTotals, 'Summary')).toHaveLength(4)
  })

  it('writes one row per day with a column per category and a total', () => {
    const days = [
      stat({ day: 2, month: 3, year: 2026 }, [
        { duration: 2 * HOUR, label: 'Alpha' },
        { duration: 0.5 * HOUR, label: 'Beta' },
      ]),
      stat({ day: 3, month: 3, year: 2026 }, [{ duration: HOUR, label: 'Beta' }]),
    ]
    const byDayAndSource = [
      { data: days, source: 'project' },
      { data: [], source: 'tag' },
    ]
    const workbook = exportAndRead(baseData({ byDayAndSource }))
    expect(workbook.SheetNames).toEqual(['Summary', 'By Project & Day'])
    expect(rows(workbook, 'By Project & Day')).toEqual([
      ['Date', 'Alpha', 'Beta', 'Total'],
      ['02.03.2026', 2, 0.5, 2.5],
      ['03.03.2026', 0, 1, 1],
    ])
  })

  it('writes the totals per category, sorted by hours, without empty categories', () => {
    const totals = stat({}, [
      { duration: HOUR, label: 'Small' },
      { duration: 3 * HOUR, label: 'Large' },
      { duration: 0, label: 'Empty' },
    ])
    const workbook = exportAndRead(baseData({ aggregated: [{ data: [totals], source: 'tag' }] }))
    expect(workbook.SheetNames).toEqual(['Summary', 'Tag Totals'])
    expect(rows(workbook, 'Tag Totals')).toEqual([
      ['Category', 'Hours', 'Percentage'],
      ['Large', 3, '75.00%'],
      ['Small', 1, '25.00%'],
    ])
  })
})
