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

import { getPeriodProgress } from './period-progress'

process.env.TZ = 'America/New_York'

// Tuesday of the week from Monday 2026-10-19 to Sunday 2026-10-25.
const NOW = new Date(2026, 9, 20, 14, 0)
const WEEK = { firstDay: new Date(2026, 9, 19), lastDay: new Date(2026, 9, 25) }

describe('getPeriodProgress', () => {
  it('adds a running booking that started on an earlier day of the week from its start', () => {
    expect(
      getPeriodProgress({
        ...WEEK,
        bookedHours: 10,
        now: NOW,
        plannedWorkingHours: 40,
        runningStart: '2026-10-19T22:00:00.000-04:00',
      }),
    ).toEqual({ fulfilledPercentage: 65, hours: 26, progressBarPercentage: 65 })
  })

  it('counts a booking that started before the week from the start of the week', () => {
    expect(
      getPeriodProgress({
        ...WEEK,
        bookedHours: 0,
        now: NOW,
        plannedWorkingHours: 40,
        runningStart: '2026-10-18T22:00:00.000-04:00',
      }).hours,
    ).toBe(38)
  })

  it('adds nothing to a week that does not contain now', () => {
    expect(
      getPeriodProgress({
        bookedHours: 30,
        firstDay: new Date(2026, 9, 12),
        lastDay: new Date(2026, 9, 18),
        now: NOW,
        plannedWorkingHours: 40,
        runningStart: '2026-10-20T13:00:00.000-04:00',
      }).hours,
    ).toBe(30)
  })

  it('counts the last day of the period up to its end', () => {
    expect(
      getPeriodProgress({
        bookedHours: 0,
        firstDay: new Date(2026, 9, 14),
        lastDay: new Date(2026, 9, 20),
        now: new Date(2026, 9, 20, 23, 30),
        plannedWorkingHours: 0,
        runningStart: '2026-10-20T23:00:00.000-04:00',
      }).hours,
    ).toBe(0.5)
  })
})
