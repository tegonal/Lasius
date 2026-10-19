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

import { type ModelsDailyBookingTotal } from '~/services/api/lasius'

import { computeStreamChartData } from './month-stream-chart-data'

// A date-only string parses as UTC midnight. West of UTC that falls on the previous day.
process.env.TZ = 'America/New_York'

const total = (date: string, minutes: number): ModelsDailyBookingTotal => ({
  bookings: 1,
  date,
  durationMs: minutes * 60 * 1000,
})

// March 2026 spans the ISO weeks 9 (Monday 23 February) to 14 (Monday 30 March).
const MARCH_WEEKS = ['Week 9', 'Week 10', 'Week 11', 'Week 12', 'Week 13', 'Week 14']
const MARCH = '2026-03-15'

describe('computeStreamChartData', () => {
  it('returns seven zero rows with every week of the month and no keys without bookings', () => {
    const { data, keys } = computeStreamChartData([], MARCH)
    expect(data).toHaveLength(7)
    for (const row of data) {
      expect(Object.keys(row)).toEqual(MARCH_WEEKS)
      expect(Object.values(row).every((value) => value === 0)).toBe(true)
    }
    expect(keys).toEqual([])
  })

  it('adds the hours of a day to its weekday and week', () => {
    const { data, keys } = computeStreamChartData([total('2026-03-02', 150)], MARCH)
    expect(data[0]?.['Week 10']).toBe(2.5)
    expect(keys).toEqual(['Week 10'])
  })

  it('rounds the hours of a day to two decimals', () => {
    const { data } = computeStreamChartData([total('2026-03-04', 40)], MARCH)
    expect(data[2]?.['Week 10']).toBe(0.67)
  })

  it('puts a Sunday into the last row', () => {
    const { data } = computeStreamChartData([total('2026-03-01', 60)], MARCH)
    expect(data[6]?.['Week 9']).toBe(1)
  })

  it('ignores a day in a week outside the month', () => {
    const { data, keys } = computeStreamChartData([total('2026-04-15', 60)], MARCH)
    expect(keys).toEqual([])
    expect(data.every((row) => !('Week 16' in row))).toBe(true)
  })

  it('lists the keys in calendar order', () => {
    const { keys } = computeStreamChartData(
      [total('2026-03-02', 60), total('2026-03-01', 60)],
      MARCH,
    )
    expect(keys).toEqual(['Week 9', 'Week 10'])
  })

  it('keeps week 1 of the next year after the December weeks', () => {
    // Monday 28 December 2026 starts the week that holds 1 January 2027.
    const { keys } = computeStreamChartData(
      [total('2026-12-29', 60), total('2026-12-01', 60)],
      '2026-12-15',
    )
    expect(keys).toEqual(['Week 49', 'Week 1'])
  })
})
