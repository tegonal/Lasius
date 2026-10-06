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

import { type ModelsBooking } from '~/services/api/lasius/modelsBooking'

import { computeWorkHealthMetrics } from './compute-work-health-metrics.server'

// The production container runs with TZ=Europe/Zurich. Zurich is 2 hours ahead of UTC in
// September, so a booking after midnight has a UTC date of the previous day.
process.env.TZ = 'Europe/Zurich'

const reference = { id: 'ref', key: 'ref' }

const booking = (start: string, end: string): ModelsBooking => ({
  bookingHash: 0,
  end: { dateTime: end, zone: 'Europe/Zurich' },
  id: start,
  organisationReference: reference,
  projectReference: reference,
  start: { dateTime: start, zone: 'Europe/Zurich' },
  tags: [],
  userReference: reference,
})

describe('computeWorkHealthMetrics', () => {
  it('counts a booking after midnight for its own day', () => {
    const { burnoutMetrics } = computeWorkHealthMetrics(
      [
        booking('2026-09-28T23:00:00.000', '2026-09-28T23:30:00.000'),
        booking('2026-09-29T00:30:00.000', '2026-09-29T01:00:00.000'),
      ],
      40,
      1,
      '2026-09-30',
    )

    expect(burnoutMetrics?.consecutiveDays).toBe(2)
    expect(burnoutMetrics?.weeklyHours).toBe(1)
  })

  it('keeps a week across the turn of the year together', () => {
    // Week 1 of 2027 starts on Monday, 28 December 2026.
    const { burnoutMetrics, weeklyData } = computeWorkHealthMetrics(
      [
        booking('2026-12-28T09:00:00.000', '2026-12-28T10:00:00.000'),
        booking('2027-01-01T09:00:00.000', '2027-01-01T10:00:00.000'),
      ],
      40,
      1,
      '2026-12-30',
    )

    expect(weeklyData).toEqual([
      { hours: 2, plannedHours: 40, weekLabel: 'W1/2027', weekNumber: 1, year: 2027 },
    ])
    expect(burnoutMetrics?.consecutiveDays).toBe(2)
  })

  // Monday 28 September 2026 to Sunday 4 October 2026 is week 40.
  const WEEK_40 = [
    '2026-09-28',
    '2026-09-29',
    '2026-09-30',
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
    '2026-10-04',
  ]
  const pad = (value: number) => String(value).padStart(2, '0')
  const workday = (date: string, hours: number, minutes = 0) =>
    booking(`${date}T08:00:00.000`, `${date}T${pad(8 + hours)}:${pad(minutes)}:00.000`)
  const day = (dayOfMonth: number, hours: number) => workday(`2026-09-${pad(dayOfMonth)}`, hours)
  const week = (days: number, hours: number, minutes = 0) =>
    WEEK_40.slice(0, days).map((date) => workday(date, hours, minutes))
  const levelOf = (bookings: ModelsBooking[]) =>
    computeWorkHealthMetrics(bookings, 40, 1, '2026-09-30').burnoutMetrics?.level

  it('returns no metrics and no weeks without bookings', () => {
    expect(computeWorkHealthMetrics([], 40, 4, '2026-09-30')).toEqual({
      burnoutMetrics: null,
      weeklyData: [],
    })
  })

  it('ignores a booking without an end and lists one entry per analysed week', () => {
    const open: ModelsBooking = { ...day(28, 4), end: undefined }
    const { burnoutMetrics, weeklyData } = computeWorkHealthMetrics(
      [open, day(29, 4)],
      40,
      3,
      '2026-09-30',
    )
    expect(weeklyData.map((w) => [w.weekLabel, w.hours])).toEqual([
      ['W38/2026', 0],
      ['W39/2026', 0],
      ['W40/2026', 4],
    ])
    expect(burnoutMetrics).toEqual({
      averageDailyHours: 4,
      consecutiveDays: 1,
      level: 'healthy',
      overtimePercentage: -90,
      plannedHours: 40,
      weeklyHours: 4,
    })
  })

  it('classifies a normal week as healthy', () => {
    expect(levelOf(week(5, 8))).toBe('healthy')
  })

  it('classifies more than 110 % of the planned hours as warning', () => {
    // 5 days of 8 h 48 min are 44 h, exactly 110 %. 8 h 54 min a day are 44.5 h.
    expect(levelOf(week(5, 8, 48))).toBe('healthy')
    expect(levelOf(week(5, 8, 54))).toBe('warning')
  })

  it('classifies more than 125 % of the planned hours as risk', () => {
    // 6 days of 8 h 30 min are 51 h. Six days alone would only be a warning.
    expect(levelOf(week(6, 8, 30))).toBe('risk')
  })

  it('classifies 6 working days as warning and 7 as risk', () => {
    expect(levelOf(week(5, 1))).toBe('healthy')
    expect(levelOf(week(6, 1))).toBe('warning')
    expect(levelOf(week(7, 1))).toBe('risk')
  })

  it('classifies an average of 9 hours a day as warning and more than 10 as risk', () => {
    expect(levelOf([day(28, 9)])).toBe('warning')
    expect(levelOf([day(28, 10)])).toBe('warning')
    expect(levelOf([day(28, 11)])).toBe('risk')
  })
})
