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
})
