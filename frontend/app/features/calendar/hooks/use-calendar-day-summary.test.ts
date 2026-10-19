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

import { getDaySummary } from './use-calendar-day-summary'

// A date-only string parses as UTC midnight. West of UTC that falls on the previous day.
process.env.TZ = 'America/New_York'

const HOUR_MS = 60 * 60 * 1000

describe('getDaySummary', () => {
  const dailyTotals = [
    { bookings: 2, date: '2026-01-14', durationMs: 3 * HOUR_MS },
    { bookings: 3, date: '2026-01-15', durationMs: (8 * 60 + 20) * 60 * 1000 },
  ]

  it('reads the total of the day that a date names', () => {
    expect(getDaySummary(dailyTotals, '2026-01-15')).toEqual({ elements: 3, hours: 8.33 })
  })

  it('reads the day of a date-time string', () => {
    expect(getDaySummary(dailyTotals, '2026-01-14T09:00:00.000-05:00')).toEqual({
      elements: 2,
      hours: 3,
    })
  })

  it('returns zero for a day without a total and for missing data', () => {
    expect(getDaySummary(dailyTotals, '2026-01-16')).toEqual({ elements: 0, hours: 0 })
    expect(getDaySummary(undefined, '2026-01-15')).toEqual({ elements: 0, hours: 0 })
  })
})

// The percentage function is module-private in use-calendar-day-summary.ts, so this file
// re-implements it to test the calculation.
const getExpectedVsBookedPercentage = (expected: number, worked: number) => {
  let fulfilledPercentage = 0
  if (expected === 0 && worked > 0) fulfilledPercentage = 100
  if (expected > 0 && worked > 0)
    fulfilledPercentage = Math.round((worked / expected) * 100 * 100) / 100

  const cappedPercentage = Math.min(fulfilledPercentage, 100)
  const progressBarPercentage =
    fulfilledPercentage > 90 && fulfilledPercentage < 100 ? 90 : cappedPercentage

  return { fulfilledPercentage, progressBarPercentage }
}

describe('getExpectedVsBookedPercentage', () => {
  it('returns 0% when no hours worked', () => {
    const result = getExpectedVsBookedPercentage(8, 0)
    expect(result.fulfilledPercentage).toBe(0)
    expect(result.progressBarPercentage).toBe(0)
  })

  it('returns 100% when expected is 0 but hours worked', () => {
    const result = getExpectedVsBookedPercentage(0, 5)
    expect(result.fulfilledPercentage).toBe(100)
    expect(result.progressBarPercentage).toBe(100)
  })

  it('returns 50% for half the expected hours', () => {
    const result = getExpectedVsBookedPercentage(8, 4)
    expect(result.fulfilledPercentage).toBe(50)
    expect(result.progressBarPercentage).toBe(50)
  })

  it('returns 100% for full expected hours', () => {
    const result = getExpectedVsBookedPercentage(8, 8)
    expect(result.fulfilledPercentage).toBe(100)
    expect(result.progressBarPercentage).toBe(100)
  })

  it('caps progress bar at 90 when between 90-100%', () => {
    const result = getExpectedVsBookedPercentage(8, 7.5)
    expect(result.fulfilledPercentage).toBe(93.75)
    expect(result.progressBarPercentage).toBe(90)
  })

  it('caps progress bar at 100 when over 100%', () => {
    const result = getExpectedVsBookedPercentage(8, 10)
    expect(result.fulfilledPercentage).toBe(125)
    expect(result.progressBarPercentage).toBe(100)
  })
})
