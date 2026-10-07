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

import { getAdaptiveGranularity, shouldUseBarChart } from './granularity-config'

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
