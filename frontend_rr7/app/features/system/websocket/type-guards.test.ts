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

import { describe, expect, it, vi } from 'vitest'

import {
  isAuthenticationFailed,
  isCurrentOrganisationTimeBookings,
  isCurrentUserTimeBookingEvent,
  isFavoriteAdded,
  isFavoriteRemoved,
  isIssueImporterSyncStatsChanged,
  isLatestTimeBooking,
  isUserTimeBookingHistoryEntryAdded,
  isUserTimeBookingHistoryEntryChanged,
  isUserTimeBookingHistoryEntryCleaned,
  isUserTimeBookingHistoryEntryRemoved,
  isWebSocketOutEvent,
  processWebSocketEvent,
} from './type-guards'

describe('isWebSocketOutEvent', () => {
  it('returns true for objects with a type property', () => {
    expect(isWebSocketOutEvent({ type: 'Pong' })).toBe(true)
  })

  it('returns false for null', () => {
    expect(isWebSocketOutEvent(null)).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(isWebSocketOutEvent('string')).toBe(false)
    expect(isWebSocketOutEvent(42)).toBe(false)
    expect(isWebSocketOutEvent(undefined)).toBe(false)
  })

  it('returns false for objects without type', () => {
    expect(isWebSocketOutEvent({ data: 'foo' })).toBe(false)
  })
})

describe('type guard functions', () => {
  const guards = [
    { fn: isAuthenticationFailed, type: 'AuthenticationFailed' },
    {
      fn: isCurrentOrganisationTimeBookings,
      type: 'CurrentOrganisationTimeBookings',
    },
    {
      fn: isCurrentUserTimeBookingEvent,
      type: 'CurrentUserTimeBookingEvent',
    },
    { fn: isFavoriteAdded, type: 'FavoriteAdded' },
    { fn: isFavoriteRemoved, type: 'FavoriteRemoved' },
    {
      fn: isIssueImporterSyncStatsChanged,
      type: 'IssueImporterSyncStatsChanged',
    },
    { fn: isLatestTimeBooking, type: 'LatestTimeBooking' },
    {
      fn: isUserTimeBookingHistoryEntryAdded,
      type: 'UserTimeBookingHistoryEntryAdded',
    },
    {
      fn: isUserTimeBookingHistoryEntryChanged,
      type: 'UserTimeBookingHistoryEntryChanged',
    },
    {
      fn: isUserTimeBookingHistoryEntryCleaned,
      type: 'UserTimeBookingHistoryEntryCleaned',
    },
    {
      fn: isUserTimeBookingHistoryEntryRemoved,
      type: 'UserTimeBookingHistoryEntryRemoved',
    },
  ] as const

  for (const { fn, type } of guards) {
    it(`${fn.name} returns true for type "${type}"`, () => {
      expect(fn({ type } as any)).toBe(true)
    })

    it(`${fn.name} returns false for other types`, () => {
      expect(fn({ type: 'Other' } as any)).toBe(false)
    })
  }
})

describe('processWebSocketEvent', () => {
  it('returns false for non-event data', () => {
    expect(processWebSocketEvent('not an event', [])).toBe(false)
    expect(processWebSocketEvent(null, [])).toBe(false)
  })

  it('returns false when no handler matches', () => {
    const result = processWebSocketEvent({ type: 'Unknown' }, [
      {
        handler: () => {},
        typeGuard: isFavoriteAdded,
      },
    ])
    expect(result).toBe(false)
  })

  it('calls the matching handler and returns true', () => {
    const handler = vi.fn()
    const event = { type: 'FavoriteAdded' }

    const result = processWebSocketEvent(event, [
      {
        handler,
        typeGuard: isFavoriteAdded,
      },
    ])

    expect(result).toBe(true)
    expect(handler).toHaveBeenCalledWith(event)
  })

  it('only calls the first matching handler', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    const event = { type: 'FavoriteAdded' }

    processWebSocketEvent(event, [
      { handler: handler1, typeGuard: isFavoriteAdded },
      { handler: handler2, typeGuard: isFavoriteAdded },
    ])

    expect(handler1).toHaveBeenCalledOnce()
    expect(handler2).not.toHaveBeenCalled()
  })
})
