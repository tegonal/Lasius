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

import { sortBookingsByDate } from './sort-bookings-by-date'

interface ModelsBooking {
  bookingHash: number
  end?: null | { dateTime: string; zone: string }
  id: string
  organisationReference: { id: string; key: string }
  projectReference: { id: string; key: string }
  start: { dateTime: string; zone: string }
  tags: Array<{ id: string; type: string }>
  userReference: { id: string; key: string }
}

const makeBooking = (
  overrides: Partial<ModelsBooking> & { start: ModelsBooking['start'] },
): ModelsBooking => {
  const defaults: ModelsBooking = {
    bookingHash: 0,
    end: null,
    id: 'b1',
    organisationReference: { id: 'o1', key: 'org1' },
    projectReference: { id: 'p1', key: 'proj1' },
    start: { dateTime: '', zone: 'UTC' },
    tags: [],
    userReference: { id: 'u1', key: 'user1' },
  }
  return { ...defaults, ...overrides }
}

describe('sortBookingsByDate', () => {
  it('returns empty array for empty input', () => {
    expect(sortBookingsByDate([])).toEqual([])
  })

  it('returns same item for single-element array', () => {
    const booking = makeBooking({
      start: { dateTime: '2024-01-15T10:00:00.000Z', zone: 'UTC' },
    })
    expect(sortBookingsByDate([booking] as any)).toEqual([booking])
  })

  it('preserves order when already sorted descending', () => {
    const a = makeBooking({
      id: 'a',
      start: { dateTime: '2024-01-15T12:00:00.000Z', zone: 'UTC' },
    })
    const b = makeBooking({
      id: 'b',
      start: { dateTime: '2024-01-15T10:00:00.000Z', zone: 'UTC' },
    })
    const result = sortBookingsByDate([a, b] as any)
    expect(result.map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('sorts unsorted bookings descending by start.dateTime', () => {
    const a = makeBooking({
      id: 'a',
      start: { dateTime: '2024-01-15T08:00:00.000Z', zone: 'UTC' },
    })
    const b = makeBooking({
      id: 'b',
      start: { dateTime: '2024-01-15T14:00:00.000Z', zone: 'UTC' },
    })
    const c = makeBooking({
      id: 'c',
      start: { dateTime: '2024-01-15T11:00:00.000Z', zone: 'UTC' },
    })
    const result = sortBookingsByDate([a, b, c] as any)
    expect(result.map((r) => r.id)).toEqual(['b', 'c', 'a'])
  })

  it('does not mutate the original array', () => {
    const a = makeBooking({
      id: 'a',
      start: { dateTime: '2024-01-15T08:00:00.000Z', zone: 'UTC' },
    })
    const b = makeBooking({
      id: 'b',
      start: { dateTime: '2024-01-15T14:00:00.000Z', zone: 'UTC' },
    })
    const original = [a, b] as any
    sortBookingsByDate(original)
    expect(original.map((r: any) => r.id)).toEqual(['a', 'b'])
  })
})
