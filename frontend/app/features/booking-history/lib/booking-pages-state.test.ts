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

import { type ModelsBooking, type ModelsBookingPage } from '~/services/api/lasius'

import { applyPage, initialPagesState, syncFirstPage } from './booking-pages-state'

const booking = (id: string): ModelsBooking => ({
  bookingHash: 0,
  id,
  organisationReference: { id: 'o', key: 'o' },
  projectReference: { id: 'p', key: 'p' },
  start: { dateTime: '2026-01-01T09:00:00.000', zone: 'UTC' },
  tags: [],
  userReference: { id: 'u', key: 'u' },
})

const page = (ids: string[], total: number): ModelsBookingPage => ({
  items: ids.map(booking),
  total,
})

const ids = (items: ModelsBooking[]) => items.map((item) => item.id)

describe('syncFirstPage', () => {
  const first = page(['1', '2'], 4)
  const scrolled = applyPage(initialPagesState(first, 'a'), page(['3', '4'], 4), 'append')

  it('keeps the state for the same loader result', () => {
    expect(syncFirstPage(scrolled, first, 'a')).toBeNull()
  })

  it('starts again from the first page for a new filter', () => {
    const next = page(['9'], 1)
    expect(syncFirstPage(scrolled, next, 'b')).toEqual(initialPagesState(next, 'b'))
  })

  it('keeps the loaded tail and asks to reload every loaded row after a revalidation', () => {
    const revalidated = page(['0', '1'], 5)
    const synced = syncFirstPage(scrolled, revalidated, 'a')
    expect(ids(synced?.items ?? [])).toEqual(['0', '1', '3', '4'])
    expect(synced?.reloadLimit).toBe(4)
    expect(synced?.total).toBe(5)
  })

  it('asks for no reload when only the first page is loaded', () => {
    const state = initialPagesState(first, 'a')
    expect(syncFirstPage(state, page(['1', '2'], 2), 'a')?.reloadLimit).toBeUndefined()
  })
})

describe('applyPage', () => {
  const state = { ...initialPagesState(page(['1', '2'], 4), 'a'), reloadLimit: 4 }

  it('appends a scroll page without a repeated row and keeps a pending reload', () => {
    const next = applyPage(state, page(['2', '3'], 4), 'append')
    expect(ids(next.items)).toEqual(['1', '2', '3'])
    expect(next.reloadLimit).toBe(4)
  })

  it('replaces the rows with a reload and clears the reload', () => {
    const next = applyPage(state, page(['5', '6', '7'], 3), 'replace')
    expect(ids(next.items)).toEqual(['5', '6', '7'])
    expect(next.reloadLimit).toBeUndefined()
    expect(next.total).toBe(3)
  })
})
