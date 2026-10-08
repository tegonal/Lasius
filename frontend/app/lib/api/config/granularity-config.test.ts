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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getAdaptiveGranularity,
  getCategoryLabel,
  type Granularity,
  shouldUseBarChart,
} from './granularity-config'

describe('granularity by past days', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 30, 12, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    ['2026-09-30', '2026-09-30', 'Day'],
    ['2026-09-16', '2026-09-30', 'Day'],
    ['2026-09-15', '2026-09-30', 'Week'],
    ['2026-08-01', '2026-09-30', 'Week'],
    ['2026-07-31', '2026-09-30', 'Month'],
    ['2023-10-01', '2026-09-30', 'Month'],
    ['2023-09-30', '2026-09-30', 'Year'],
    ['2026-09-01', '2026-12-31', 'Week'],
    ['2026-10-01', '2026-10-31', 'Day'],
  ])('getAdaptiveGranularity(%s, %s) is %s', (from, to, expected) => {
    expect(getAdaptiveGranularity(from, to)).toBe(expected)
  })

  it.each([
    ['2026-09-28', '2026-09-30', true],
    ['2026-09-27', '2026-09-30', false],
    ['2026-09-29', '2026-12-31', true],
    ['2026-10-01', '2026-10-31', true],
  ])('shouldUseBarChart(%s, %s) is %s', (from, to, expected) => {
    expect(shouldUseBarChart(from, to)).toBe(expected)
  })
})

describe('granularity with the user clock', () => {
  // The server runs in Zurich. A user in Tokyo has 15 past days, a user in Los Angeles 14.
  const tokyoToday = new Date(2026, 9, 16, 9, 0)
  const losAngelesToday = new Date(2026, 9, 15, 17, 0)

  it('counts the days up to today of the user', () => {
    expect(getAdaptiveGranularity('2026-10-01', '2026-10-31', tokyoToday)).toBe('Week')
    expect(getAdaptiveGranularity('2026-10-01', '2026-10-31', losAngelesToday)).toBe('Day')
  })

  it('reads a range bound with an offset as its written day', () => {
    expect(
      getAdaptiveGranularity(
        '2026-10-01T00:00:00.000+09:00',
        '2026-10-31T23:59:59.999+09:00',
        tokyoToday,
      ),
    ).toBe('Week')
    expect(
      shouldUseBarChart(
        '2026-10-14T00:00:00.000-07:00',
        '2026-10-31T23:59:59.999-07:00',
        losAngelesToday,
      ),
    ).toBe(true)
  })
})

describe('getCategoryLabel', () => {
  const category = { day: 5, month: 10, week: 41, year: 2026 }

  it.each([
    ['Day', '5.10'],
    ['Week', 'W 41'],
    ['Month', '10.2026'],
    ['Year', '2026'],
  ] as const)('formats %s as %s', (granularity, expected) => {
    expect(getCategoryLabel(category, granularity)).toBe(expected)
  })

  it('returns an empty label for an unknown granularity', () => {
    expect(getCategoryLabel(category, 'All' as Granularity)).toBe('')
  })
})
