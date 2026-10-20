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

import { getDayProgress } from './day-progress'

// A date-only string parses as UTC midnight. West of UTC that falls on the previous day.
process.env.TZ = 'America/New_York'

const NOW = new Date(2026, 9, 20, 14, 0)

describe('getDayProgress', () => {
  it('adds the running booking to the finished hours of today', () => {
    expect(
      getDayProgress({
        bookedHours: 3,
        now: NOW,
        plannedWorkingHours: 8,
        runningStart: '2026-10-20T13:00:00.000-04:00',
        selectedDate: '2026-10-20',
      }),
    ).toEqual({ fulfilledPercentage: 50, hours: 4, progressBarPercentage: 50 })
  })

  it('counts a booking that started before midnight from midnight', () => {
    expect(
      getDayProgress({
        bookedHours: 0,
        now: NOW,
        plannedWorkingHours: 0,
        runningStart: '2026-10-19T22:00:00.000-04:00',
        selectedDate: '2026-10-20',
      }).hours,
    ).toBe(14)
  })

  it('adds nothing on another day or without a running booking', () => {
    const input = { bookedHours: 2, now: NOW, plannedWorkingHours: 8 }
    expect(
      getDayProgress({
        ...input,
        runningStart: '2026-10-20T13:00:00.000-04:00',
        selectedDate: '2026-10-19',
      }).hours,
    ).toBe(2)
    expect(getDayProgress({ ...input, selectedDate: '2026-10-20' }).hours).toBe(2)
  })
})
