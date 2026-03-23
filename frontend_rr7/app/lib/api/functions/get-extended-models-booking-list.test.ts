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

import { format } from 'date-fns'
import { describe, expect, it } from 'vitest'

import { getExtendedModelsBookingList } from './get-extended-models-booking-list'

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

describe('getExtendedModelsBookingList', () => {
  it('returns empty array for empty input', () => {
    expect(getExtendedModelsBookingList([] as any)).toEqual([])
  })

  it('extends a booking with date, duration, durationString, and fromTo', () => {
    const startDt = '2024-01-15T10:00:00.000Z'
    const endDt = '2024-01-15T11:30:00.000Z'
    const booking = makeBooking({
      end: { dateTime: endDt, zone: 'UTC' },
      start: { dateTime: startDt, zone: 'UTC' },
    })
    const result = getExtendedModelsBookingList([booking] as any)

    // format() uses local timezone, so compute expected values the same way
    const expectedDate = format(new Date(startDt), 'd.M.y')
    const expectedFromTo = `${format(new Date(startDt), 'HH:mm')} - ${format(new Date(endDt), 'HH:mm')}`

    expect(result).toHaveLength(1)
    expect(result[0]!.date).toBe(expectedDate)
    expect(result[0]!.duration).toBe(1.5)
    expect(result[0]!.durationString).toBe('01:30')
    expect(result[0]!.fromTo).toBe(expectedFromTo)
  })

  it('preserves original booking fields', () => {
    const booking = makeBooking({
      end: { dateTime: '2024-01-15T11:00:00.000Z', zone: 'UTC' },
      id: 'custom-id',
      start: { dateTime: '2024-01-15T10:00:00.000Z', zone: 'UTC' },
      tags: [{ id: 'tag1', type: 'SimpleTag' }],
    })
    const result = getExtendedModelsBookingList([booking] as any)

    expect(result[0]!.id).toBe('custom-id')
    expect(result[0]!.tags).toEqual([{ id: 'tag1', type: 'SimpleTag' }])
    expect(result[0]!.projectReference).toEqual({ id: 'p1', key: 'proj1' })
  })
})
