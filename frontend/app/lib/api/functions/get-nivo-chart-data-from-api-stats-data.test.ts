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

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { type Granularity } from '~/lib/api/config/granularity-config'
import { type ModelsBookingStats, type ModelsBookingStatsCategory } from '~/services/api/lasius'

import { getNivoChartDataFromApiStatsData } from './get-nivo-chart-data-from-api-stats-data'

const HOUR = 60 * 60 * 1000

// Distinct hours per weekday, so a shifted day changes the result.
const plannedHours = {
  friday: 5,
  monday: 1,
  saturday: 6,
  sunday: 7,
  thursday: 4,
  tuesday: 2,
  wednesday: 3,
}

const ceilingOf = (category: ModelsBookingStatsCategory, granularity: Granularity) =>
  getNivoChartDataFromApiStatsData([{ category, values: [] }], granularity, plannedHours)
    ?.ceilingData[0]?.value

describe('getNivoChartDataFromApiStatsData', () => {
  it('returns undefined for no data', () => {
    expect(getNivoChartDataFromApiStatsData([], 'Day')).toBeUndefined()
  })

  it('builds one chart row per category and the union of the labels as keys', () => {
    const data: ModelsBookingStats[] = [
      {
        category: { day: 5, month: 10, year: 2026 },
        values: [
          { duration: 2 * HOUR, label: 'alpha' },
          { duration: null, label: 'beta' },
        ],
      },
      {
        category: { day: 6, month: 10, year: 2026 },
        values: [{ duration: 1.5 * HOUR, label: null }],
      },
    ]

    expect(getNivoChartDataFromApiStatsData(data, 'Day')).toEqual({
      ceilingData: [
        { category: '5.10', value: 0 },
        { category: '6.10', value: 0 },
      ],
      data: [
        { alpha: 2, beta: 0, category: '5.10' },
        { '': 1.5, category: '6.10' },
      ],
      keys: ['alpha', 'beta', ''],
    })
  })

  it('returns a ceiling of 0 without planned hours', () => {
    const result = getNivoChartDataFromApiStatsData(
      [{ category: { month: 10, year: 2026 }, values: [] }],
      'Month',
      null,
    )
    expect(result?.ceilingData).toEqual([{ category: '10.2026', value: 0 }])
  })

  it('uses the planned hours of the weekday for a day', () => {
    expect(ceilingOf({ day: 5, month: 10, year: 2026 }, 'Day')).toBe(plannedHours.monday)
    expect(ceilingOf({ day: 11, month: 10, year: 2026 }, 'Day')).toBe(plannedHours.sunday)
  })

  it('sums Monday to Sunday for an ISO week', () => {
    expect(ceilingOf({ week: 41, year: 2026 }, 'Week')).toBe(28)
  })

  // March 2026 starts on a Sunday: 5 Sundays, 5 Mondays, 5 Tuesdays and 4 of every other weekday.
  const march2026 = 5 * 7 + 5 * 1 + 5 * 2 + 4 * (3 + 4 + 5 + 6)

  // 2026 starts on a Thursday and has 365 days: 53 Thursdays and 52 of every other weekday.
  const year2026 = 52 * 28 + plannedHours.thursday

  it('sums every day of the month', () => {
    expect(ceilingOf({ month: 3, year: 2026 }, 'Month')).toBe(march2026)
  })

  it('sums every day of the year', () => {
    expect(ceilingOf({ year: 2026 }, 'Year')).toBe(year2026)
  })

  describe('west of UTC', () => {
    const originalTz = process.env.TZ

    beforeEach(() => {
      process.env.TZ = 'America/New_York'
    })

    afterEach(() => {
      process.env.TZ = originalTz
    })

    it('keeps the month and the year in the local calendar', () => {
      // Node applies a TZ change at run time. The offset proves that the zone took effect.
      expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(300)
      expect(ceilingOf({ month: 3, year: 2026 }, 'Month')).toBe(march2026)
      expect(ceilingOf({ year: 2026 }, 'Year')).toBe(year2026)
      expect(ceilingOf({ day: 5, month: 10, year: 2026 }, 'Day')).toBe(plannedHours.monday)
    })
  })
})
