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

import { augmentBookingsList } from './augment-bookings-list'

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

describe('augmentBookingsList', () => {
  it('returns empty array for empty input', () => {
    expect(augmentBookingsList([])).toEqual([])
  })

  it('marks single booking as isMostRecent with no hasNextItem', () => {
    const booking = makeBooking({
      end: { dateTime: '2024-01-15T11:00:00.000Z', zone: 'UTC' },
      start: { dateTime: '2024-01-15T10:00:00.000Z', zone: 'UTC' },
    })
    const result = augmentBookingsList([booking] as any)
    expect(result).toHaveLength(1)
    expect(result[0]!.isMostRecent).toBe(true)
    expect(result[0]!.hasNextItem).toBe(false)
  })

  it('sets no allowInsert and no overlap when bookings are exactly contiguous', () => {
    // B ends at 10:00, A starts at 10:00 — no gap, no overlap
    const a = makeBooking({
      end: { dateTime: '2024-01-15T11:00:00.000Z', zone: 'UTC' },
      id: 'a',
      start: { dateTime: '2024-01-15T10:00:00.000Z', zone: 'UTC' },
    })
    const b = makeBooking({
      end: { dateTime: '2024-01-15T10:00:00.000Z', zone: 'UTC' },
      id: 'b',
      start: { dateTime: '2024-01-15T09:00:00.000Z', zone: 'UTC' },
    })
    const result = augmentBookingsList([a, b] as any)
    // Sorted desc: a (10:00), b (09:00)
    const first = result[0]!
    expect(first.id).toBe('a')
    expect(first.isMostRecent).toBe(true)
    expect(first.allowInsert).toBe(false)
    expect(first.overlapsWithNext).toBeUndefined()
  })

  it('sets allowInsert when there is a gap between bookings', () => {
    // B ends at 09:30, A starts at 10:00 — 30-min gap
    const a = makeBooking({
      end: { dateTime: '2024-01-15T11:00:00.000Z', zone: 'UTC' },
      id: 'a',
      start: { dateTime: '2024-01-15T10:00:00.000Z', zone: 'UTC' },
    })
    const b = makeBooking({
      end: { dateTime: '2024-01-15T09:30:00.000Z', zone: 'UTC' },
      id: 'b',
      start: { dateTime: '2024-01-15T08:00:00.000Z', zone: 'UTC' },
    })
    const result = augmentBookingsList([a, b] as any)
    const first = result[0]!
    expect(first.id).toBe('a')
    expect(first.allowInsert).toBe(true)
  })

  it('sets overlapsWithNext when bookings overlap', () => {
    // B ends at 10:30 but A starts at 10:00 — B overlaps into A
    const a = makeBooking({
      end: { dateTime: '2024-01-15T11:00:00.000Z', zone: 'UTC' },
      id: 'a',
      start: { dateTime: '2024-01-15T10:00:00.000Z', zone: 'UTC' },
    })
    const b = makeBooking({
      end: { dateTime: '2024-01-15T10:30:00.000Z', zone: 'UTC' },
      id: 'b',
      start: { dateTime: '2024-01-15T09:00:00.000Z', zone: 'UTC' },
    })
    const result = augmentBookingsList([a, b] as any)
    const first = result[0]!
    expect(first.id).toBe('a')
    expect(first.overlapsWithNext).toBeDefined()
    expect(first.overlapsWithNext!.id).toBe('b')
  })

  it('marks isMostRecent only on first and hasNextItem on all but last for three bookings', () => {
    const a = makeBooking({
      end: { dateTime: '2024-01-15T13:00:00.000Z', zone: 'UTC' },
      id: 'a',
      start: { dateTime: '2024-01-15T12:00:00.000Z', zone: 'UTC' },
    })
    const b = makeBooking({
      end: { dateTime: '2024-01-15T11:00:00.000Z', zone: 'UTC' },
      id: 'b',
      start: { dateTime: '2024-01-15T10:00:00.000Z', zone: 'UTC' },
    })
    const c = makeBooking({
      end: { dateTime: '2024-01-15T09:00:00.000Z', zone: 'UTC' },
      id: 'c',
      start: { dateTime: '2024-01-15T08:00:00.000Z', zone: 'UTC' },
    })
    const result = augmentBookingsList([c, a, b] as any)
    // Sorted desc: a, b, c
    expect(result[0]!.isMostRecent).toBe(true)
    expect(result[1]!.isMostRecent).toBe(false)
    expect(result[2]!.isMostRecent).toBe(false)

    expect(result[0]!.hasNextItem).toBe(true)
    expect(result[1]!.hasNextItem).toBe(true)
    expect(result[2]!.hasNextItem).toBe(false)
  })
})
