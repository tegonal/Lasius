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

import { getAdjacentBookings, getLatestEndedBooking } from './day-bookings'

const at = (time: string) => ({ dateTime: `2026-10-19T${time}:00+02:00` })
const running = { end: null, id: 'running', start: at('13:00') }
const late = { end: at('12:00'), id: 'late', start: at('11:00') }
const early = { end: at('09:00'), id: 'early', start: at('08:00') }
const newestFirst = [running, late, early]

describe('getAdjacentBookings', () => {
  it('returns the earlier booking as previous and the later booking as next', () => {
    expect(getAdjacentBookings(newestFirst, 'late')).toEqual({ next: running, previous: early })
  })

  it('returns no neighbour past either end of the list', () => {
    expect(getAdjacentBookings(newestFirst, 'running').next).toBeUndefined()
    expect(getAdjacentBookings(newestFirst, 'early').previous).toBeUndefined()
  })

  it('returns no neighbours for an id that is not in the list', () => {
    expect(getAdjacentBookings(newestFirst, 'other')).toEqual({
      next: undefined,
      previous: undefined,
    })
  })
})

describe('getLatestEndedBooking', () => {
  const day = new Date(2026, 9, 19)

  it('skips the running booking', () => {
    expect(getLatestEndedBooking(newestFirst, day)).toBe(late)
  })

  it('skips a booking that starts at or after startedBefore', () => {
    expect(getLatestEndedBooking(newestFirst, day, at('11:00').dateTime)).toBe(early)
  })

  it('returns undefined when no booking ends on the given day', () => {
    expect(getLatestEndedBooking(newestFirst, new Date(2026, 9, 15))).toBeUndefined()
  })

  it('returns undefined for an empty day', () => {
    expect(getLatestEndedBooking([], day)).toBeUndefined()
  })
})
