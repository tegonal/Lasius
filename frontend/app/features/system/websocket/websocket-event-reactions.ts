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

import { type AddToastOptions } from '~/components/ui/feedback/use-toast'
import { ROUTES } from '~/config/routes.constants'
import { type SchemaTranslationFunction } from '~/lib/i18n-types'
import { type WebSocketOutEvent } from '~/services/api/lasius/webSocketOutEvent'

export type WebSocketEventReaction = {
  errorLog?: { message: string; tag: string }
  ignored?: boolean
  revalidate: boolean
  toast?: AddToastOptions
}

type EventByType = { [Event in WebSocketOutEvent as Event['type']]: Event }

type ReactionTable = {
  [Type in keyof EventByType]: (
    event: EventByType[Type],
    t: SchemaTranslationFunction,
  ) => WebSocketEventReaction
}

// The event reports a change from another tab or device, so the client revalidates its loaders.
const revalidateWithToast = (message: string): WebSocketEventReaction => ({
  revalidate: true,
  toast: { message, type: 'SUCCESS' },
})

const IGNORED: WebSocketEventReaction = { ignored: true, revalidate: false }

const importerStatusReaction: ReactionTable['IssueImporterSyncStatsChanged'] = (event, t) => {
  const action = {
    href: ROUTES.ORGANISATION.INTEGRATIONS,
    label: t('integrations:issueImporters.actions.viewIntegrations', {
      defaultValue: 'View Integrations',
    }),
  }

  const { connectivityStatus } = event.syncStatus
  if (connectivityStatus === 'degraded') {
    return {
      revalidate: true,
      toast: {
        action,
        message: t('integrations:issueImporters.status.connectivityDegraded', {
          configName: event.configName,
          defaultValue: 'Issue importer connectivity degraded: {{configName}}',
        }),
        ttl: 120_000,
        type: 'WARNING',
      },
    }
  }
  if (connectivityStatus === 'failed') {
    const issueMessage = event.syncStatus.currentIssue?.message
    return {
      ...(issueMessage && {
        errorLog: { message: issueMessage, tag: '[IssueImporterSyncStatsChanged]' },
      }),
      revalidate: true,
      toast: {
        action,
        message: t('integrations:issueImporters.status.connectivityFailed', {
          configName: event.configName,
          defaultValue: 'Issue importer connectivity failed: {{configName}}',
        }),
        ttl: 120_000,
        type: 'ERROR',
      },
    }
  }
  // A status that the generated client does not know yet still revalidates, as every status did before.
  return { revalidate: true }
}

const REACTIONS: ReactionTable = {
  AuthenticationFailed: (_event, t) => ({
    errorLog: { message: 'WebSocket authentication failed', tag: '[AuthenticationFailed]' },
    revalidate: false,
    toast: {
      message: t('common:auth.status.authenticationFailed', {
        defaultValue: 'Authentication failed. Please log in again.',
      }),
      ttl: 10_000,
      type: 'ERROR',
    },
  }),
  CurrentOrganisationTimeBookings: () => IGNORED,
  CurrentUserTimeBookingEvent: () => ({ revalidate: true }),
  FavoriteAdded: (_event, t) =>
    revalidateWithToast(
      t('common:bookings.actions.addedToFavorites', { defaultValue: 'Booking added to favorites' }),
    ),
  FavoriteRemoved: (_event, t) =>
    revalidateWithToast(t('common:favorites.status.removed', { defaultValue: 'Favorite removed' })),
  HelloClient: () => IGNORED,
  IssueImporterSyncStatsChanged: importerStatusReaction,
  LatestTimeBooking: (_event, t) => ({
    revalidate: false,
    toast: {
      message: t('common:bookings.status.started', { defaultValue: 'Booking started' }),
      type: 'SUCCESS',
    },
  }),
  Pong: () => IGNORED,
  UserTimeBookingHistoryEntryAdded: (_event, t) =>
    revalidateWithToast(t('common:bookings.status.added', { defaultValue: 'Booking added' })),
  UserTimeBookingHistoryEntryChanged: (_event, t) =>
    revalidateWithToast(t('common:bookings.status.updated', { defaultValue: 'Booking updated' })),
  UserTimeBookingHistoryEntryCleaned: (_event, t) => ({
    revalidate: true,
    toast: {
      message: t('common:bookings.status.historyCleared', {
        defaultValue: 'Booking history cleared',
      }),
      type: 'NOTIFICATION',
    },
  }),
  UserTimeBookingHistoryEntryRemoved: (_event, t) =>
    revalidateWithToast(t('common:bookings.status.removed', { defaultValue: 'Booking removed' })),
}

const isKnownEventType = (type: string): type is keyof EventByType => Object.hasOwn(REACTIONS, type)

// The type travels as its own parameter, so TypeScript correlates the table entry with the event.
const reactionFor = <Type extends keyof EventByType>(
  type: Type,
  event: EventByType[Type],
  t: SchemaTranslationFunction,
): WebSocketEventReaction => REACTIONS[type](event, t)

/**
 * Returns the client reaction to a WebSocket event, or undefined for an event type that the
 * generated API types do not know. The backend sends some such types, for example UserLoggedOutV2.
 */
export const getWebSocketEventReaction = (
  event: WebSocketOutEvent,
  t: SchemaTranslationFunction,
): undefined | WebSocketEventReaction =>
  isKnownEventType(event.type) ? reactionFor(event.type, event, t) : undefined
