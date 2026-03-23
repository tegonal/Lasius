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

import { getModelsBookingSummary } from './get-models-booking-summary'

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

describe('getModelsBookingSummary', () => {
  it('returns zero elements and zero hours for empty list', () => {
    expect(getModelsBookingSummary([] as any)).toEqual({
      elements: 0,
      hours: 0,
    })
  })

  it('returns correct summary for a single 1-hour booking', () => {
    const booking = makeBooking({
      end: { dateTime: '2024-01-15T11:00:00.000Z', zone: 'UTC' },
      start: { dateTime: '2024-01-15T10:00:00.000Z', zone: 'UTC' },
    })
    const result = getModelsBookingSummary([booking] as any)
    expect(result.elements).toBe(1)
    expect(result.hours).toBe(1)
  })

  it('sums hours across multiple bookings rounded to 2 decimals', () => {
    const a = makeBooking({
      end: { dateTime: '2024-01-15T09:30:00.000Z', zone: 'UTC' }, // 1.5h
      id: 'a',
      start: { dateTime: '2024-01-15T08:00:00.000Z', zone: 'UTC' },
    })
    const b = makeBooking({
      end: { dateTime: '2024-01-15T10:45:00.000Z', zone: 'UTC' }, // 0.75h
      id: 'b',
      start: { dateTime: '2024-01-15T10:00:00.000Z', zone: 'UTC' },
    })
    const c = makeBooking({
      end: { dateTime: '2024-01-15T14:00:00.000Z', zone: 'UTC' }, // 1h
      id: 'c',
      start: { dateTime: '2024-01-15T13:00:00.000Z', zone: 'UTC' },
    })
    const result = getModelsBookingSummary([a, b, c] as any)
    expect(result.elements).toBe(3)
    expect(result.hours).toBe(3.25)
  })
})
