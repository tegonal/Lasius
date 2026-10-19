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

import { deduplicateBookings } from './recent-bookings'

const reference = (id: string) => ({ id, key: id })

const booking = (
  id: string,
  projectId: string,
  tagIds: string[],
  start: string,
): ModelsBooking => ({
  bookingHash: 0,
  id,
  organisationReference: reference('org'),
  projectReference: reference(projectId),
  start: { dateTime: `2026-10-${start}:00.000`, zone: 'Europe/Zurich' },
  tags: tagIds.map((tagId) => ({ id: tagId, type: 'SimpleTag' })),
  userReference: reference('user'),
})

describe('deduplicateBookings', () => {
  it('orders the bookings by project name', () => {
    const beta = booking('beta', 'Beta', [], '19T08:00')
    const alpha = booking('alpha', 'alpha', [], '12T08:00')
    const gamma = booking('gamma', 'Gamma', [], '15T08:00')

    expect(deduplicateBookings([beta, gamma, alpha]).map((b) => b.id)).toEqual([
      'alpha',
      'beta',
      'gamma',
    ])
  })

  it('returns the newest booking first inside one project', () => {
    const old = booking('old', 'p1', ['a'], '12T08:00')
    const recent = booking('recent', 'p1', [], '19T08:00')

    expect(deduplicateBookings([old, recent]).map((b) => b.id)).toEqual(['recent', 'old'])
  })

  it('keeps one booking for the same project and tags in any tag order', () => {
    const newest = booking('newest', 'p1', ['a', 'b'], '19T10:00')
    const older = booking('older', 'p1', ['b', 'a'], '18T10:00')

    expect(deduplicateBookings([older, newest]).map((b) => b.id)).toEqual(['newest'])
  })

  it('keeps bookings of the same project with different tags', () => {
    const withTag = booking('with-tag', 'p1', ['a'], '19T10:00')
    const without = booking('without', 'p1', [], '18T10:00')

    expect(deduplicateBookings([withTag, without])).toHaveLength(2)
  })

  it('keeps the newest bookings at the limit', () => {
    const items = ['10', '11', '12'].map((day) => booking(day, `p${day}`, [], `${day}T08:00`))

    expect(deduplicateBookings(items, 2).map((b) => b.id)).toEqual(['11', '12'])
  })

  it('returns an empty list for no bookings', () => {
    expect(deduplicateBookings([])).toEqual([])
  })
})
