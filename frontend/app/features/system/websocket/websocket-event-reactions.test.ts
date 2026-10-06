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

import { ROUTES } from '~/config/routes.constants'
import { type WebSocketOutEvent } from '~/services/api/lasius/webSocketOutEvent'

import { isWebSocketOutEvent } from './type-guards'
import { getWebSocketEventReaction } from './websocket-event-reactions'

const t = (key: string, options: (Record<string, unknown> & { defaultValue: string }) | string) => {
  if (typeof options === 'string') return `${key}|${options}`
  const { configName, defaultValue } = options
  return `${key}|${defaultValue}${typeof configName === 'string' ? `|${configName}` : ''}`
}

// The reactions receive socket messages. The input passes the same boundary guard as a real message.
const toEvent = (value: unknown): WebSocketOutEvent => {
  if (!isWebSocketOutEvent(value)) {
    throw new TypeError('The test value is not a WebSocket event')
  }
  return value
}

const reactionFor = (value: unknown) => getWebSocketEventReaction(toEvent(value), t)

const importerEvent = (connectivityStatus: string, issueMessage?: string) => ({
  configName: 'GitLab main',
  syncStatus: {
    connectivityStatus,
    currentIssue: issueMessage ? { message: issueMessage } : undefined,
  },
  type: 'IssueImporterSyncStatsChanged',
})

describe('getWebSocketEventReaction', () => {
  it.each([
    ['UserTimeBookingHistoryEntryAdded', 'common:bookings.status.added|Booking added'],
    ['UserTimeBookingHistoryEntryChanged', 'common:bookings.status.updated|Booking updated'],
    ['UserTimeBookingHistoryEntryRemoved', 'common:bookings.status.removed|Booking removed'],
    ['FavoriteAdded', 'common:bookings.actions.addedToFavorites|Booking added to favorites'],
    ['FavoriteRemoved', 'common:favorites.status.removed|Favorite removed'],
  ])('revalidates and shows a success toast for %s', (type, message) => {
    expect(reactionFor({ type })).toEqual({
      revalidate: true,
      toast: { message, type: 'SUCCESS' },
    })
  })

  it('revalidates without a toast for a change of the current booking', () => {
    expect(reactionFor({ type: 'CurrentUserTimeBookingEvent' })).toEqual({ revalidate: true })
  })

  it('shows a toast without a revalidation for a started booking', () => {
    expect(reactionFor({ type: 'LatestTimeBooking' })).toEqual({
      revalidate: false,
      toast: { message: 'common:bookings.status.started|Booking started', type: 'SUCCESS' },
    })
  })

  it('shows a notification for a cleared history', () => {
    expect(reactionFor({ type: 'UserTimeBookingHistoryEntryCleaned' })?.toast?.type).toBe(
      'NOTIFICATION',
    )
  })

  it('logs and shows an error for a failed authentication', () => {
    const reaction = reactionFor({ type: 'AuthenticationFailed' })

    expect(reaction?.revalidate).toBe(false)
    expect(reaction?.errorLog?.tag).toBe('[AuthenticationFailed]')
    expect(reaction?.toast).toMatchObject({ ttl: 10_000, type: 'ERROR' })
  })

  it.each(['Pong', 'HelloClient', 'CurrentOrganisationTimeBookings'])(
    'does nothing for %s',
    (type) => {
      expect(reactionFor({ type })).toEqual({ ignored: true, revalidate: false })
    },
  )

  it('returns undefined for an event type that the API types do not know', () => {
    expect(reactionFor({ type: 'UserLoggedOutV2' })).toBeUndefined()
  })

  describe('importer status', () => {
    it('warns with a link to the integrations for a degraded connection', () => {
      expect(reactionFor(importerEvent('degraded'))).toEqual({
        revalidate: true,
        toast: {
          action: {
            href: ROUTES.ORGANISATION.INTEGRATIONS,
            label: 'integrations:issueImporters.actions.viewIntegrations|View Integrations',
          },
          message:
            'integrations:issueImporters.status.connectivityDegraded|Issue importer connectivity degraded: {{configName}}|GitLab main',
          ttl: 120_000,
          type: 'WARNING',
        },
      })
    })

    it('shows an error and logs the issue for a failed connection', () => {
      const reaction = reactionFor(importerEvent('failed', 'HTTP 401'))

      expect(reaction?.toast?.type).toBe('ERROR')
      expect(reaction?.errorLog).toEqual({
        message: 'HTTP 401',
        tag: '[IssueImporterSyncStatsChanged]',
      })
    })

    it('logs nothing for a failed connection without an issue message', () => {
      expect(reactionFor(importerEvent('failed'))?.errorLog).toBeUndefined()
    })

    it.each(['healthy', 'unknown', 'rateLimited'])(
      'only revalidates for the status %s',
      (status) => {
        expect(reactionFor(importerEvent(status))).toEqual({ revalidate: true })
      },
    )
  })
})
