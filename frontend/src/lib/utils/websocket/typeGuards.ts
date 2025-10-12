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

import { WebSocketAuthenticationFailed } from 'lib/api/lasius/webSocketAuthenticationFailed'
import { WebSocketCurrentOrganisationTimeBookings } from 'lib/api/lasius/webSocketCurrentOrganisationTimeBookings'
import { WebSocketCurrentUserTimeBookingEvent } from 'lib/api/lasius/webSocketCurrentUserTimeBookingEvent'
import { WebSocketFavoriteAdded } from 'lib/api/lasius/webSocketFavoriteAdded'
import { WebSocketFavoriteRemoved } from 'lib/api/lasius/webSocketFavoriteRemoved'
import { WebSocketIssueImporterSyncStatsChanged } from 'lib/api/lasius/webSocketIssueImporterSyncStatsChanged'
import { WebSocketLatestTimeBooking } from 'lib/api/lasius/webSocketLatestTimeBooking'
import { WebSocketOutEvent } from 'lib/api/lasius/webSocketOutEvent'
import { WebSocketUserTimeBookingHistoryEntryAdded } from 'lib/api/lasius/webSocketUserTimeBookingHistoryEntryAdded'
import { WebSocketUserTimeBookingHistoryEntryChanged } from 'lib/api/lasius/webSocketUserTimeBookingHistoryEntryChanged'
import { WebSocketUserTimeBookingHistoryEntryCleaned } from 'lib/api/lasius/webSocketUserTimeBookingHistoryEntryCleaned'
import { WebSocketUserTimeBookingHistoryEntryRemoved } from 'lib/api/lasius/webSocketUserTimeBookingHistoryEntryRemoved'

/**
 * Type guard utilities for WebSocket event data.
 * Uses TypeScript's discriminated union type narrowing to provide compile-time type safety.
 * No runtime string comparisons needed - the type system handles everything.
 */

/**
 * Type-safe validator that checks if unknown data is a valid WebSocketOutEvent.
 * This is the only runtime check we need - it validates the discriminated union.
 */
export function isWebSocketOutEvent(data: unknown): data is WebSocketOutEvent {
  return typeof data === 'object' && data !== null && 'type' in data
}

/**
 * Event handler definition for type-safe websocket event processing.
 * The type parameter T must be a specific event type from the WebSocketOutEvent union.
 */
export type WebSocketEventHandler<T extends WebSocketOutEvent> = {
  /** Type guard to validate and narrow the event type */
  typeGuard: (event: WebSocketOutEvent) => event is T
  /** Handler function that receives the typed event */
  handler: (event: T) => void
}

/**
 * Processes a websocket message through a list of event handlers.
 * Uses TypeScript's type narrowing - no string comparisons needed.
 *
 * @param message - The unknown websocket message to process
 * @param handlers - Array of type-safe event handler definitions
 * @returns true if event was handled, false if unhandled
 *
 * @example
 * const handled = processWebSocketEvent(lastMessage, [
 *   {
 *     typeGuard: isIssueImporterSyncStatsChanged,
 *     handler: (event) => {
 *       // event is automatically typed as WebSocketIssueImporterSyncStatsChanged
 *       console.log(event.configName)
 *     }
 *   }
 * ])
 */
export function processWebSocketEvent(
  message: unknown,
  handlers: WebSocketEventHandler<any>[],
): boolean {
  // First, validate that message is a valid WebSocketOutEvent
  if (!isWebSocketOutEvent(message)) {
    return false
  }

  // Now TypeScript knows message is WebSocketOutEvent
  // Each handler's type guard will narrow it further
  for (const { typeGuard, handler } of handlers) {
    if (typeGuard(message)) {
      handler(message) // TypeScript infers the correct type here
      return true
    }
  }
  return false
}

/**
 * Type guard for CurrentUserTimeBookingEvent.
 * Leverages TypeScript's discriminated union narrowing on the 'type' property.
 */
export function isCurrentUserTimeBookingEvent(
  event: WebSocketOutEvent,
): event is WebSocketCurrentUserTimeBookingEvent {
  return event.type === 'CurrentUserTimeBookingEvent'
}

/**
 * Type guard for UserTimeBookingHistoryEntryAdded
 */
export function isUserTimeBookingHistoryEntryAdded(
  event: WebSocketOutEvent,
): event is WebSocketUserTimeBookingHistoryEntryAdded {
  return event.type === 'UserTimeBookingHistoryEntryAdded'
}

/**
 * Type guard for UserTimeBookingHistoryEntryChanged
 */
export function isUserTimeBookingHistoryEntryChanged(
  event: WebSocketOutEvent,
): event is WebSocketUserTimeBookingHistoryEntryChanged {
  return event.type === 'UserTimeBookingHistoryEntryChanged'
}

/**
 * Type guard for UserTimeBookingHistoryEntryRemoved
 */
export function isUserTimeBookingHistoryEntryRemoved(
  event: WebSocketOutEvent,
): event is WebSocketUserTimeBookingHistoryEntryRemoved {
  return event.type === 'UserTimeBookingHistoryEntryRemoved'
}

/**
 * Type guard for FavoriteAdded
 */
export function isFavoriteAdded(event: WebSocketOutEvent): event is WebSocketFavoriteAdded {
  return event.type === 'FavoriteAdded'
}

/**
 * Type guard for FavoriteRemoved
 */
export function isFavoriteRemoved(event: WebSocketOutEvent): event is WebSocketFavoriteRemoved {
  return event.type === 'FavoriteRemoved'
}

/**
 * Type guard for LatestTimeBooking
 */
export function isLatestTimeBooking(event: WebSocketOutEvent): event is WebSocketLatestTimeBooking {
  return event.type === 'LatestTimeBooking'
}

/**
 * Type guard for CurrentOrganisationTimeBookings
 */
export function isCurrentOrganisationTimeBookings(
  event: WebSocketOutEvent,
): event is WebSocketCurrentOrganisationTimeBookings {
  return event.type === 'CurrentOrganisationTimeBookings'
}

/**
 * Type guard for IssueImporterSyncStatsChanged
 */
export function isIssueImporterSyncStatsChanged(
  event: WebSocketOutEvent,
): event is WebSocketIssueImporterSyncStatsChanged {
  return event.type === 'IssueImporterSyncStatsChanged'
}

/**
 * Type guard for UserTimeBookingHistoryEntryCleaned
 */
export function isUserTimeBookingHistoryEntryCleaned(
  event: WebSocketOutEvent,
): event is WebSocketUserTimeBookingHistoryEntryCleaned {
  return event.type === 'UserTimeBookingHistoryEntryCleaned'
}

/**
 * Type guard for AuthenticationFailed
 */
export function isAuthenticationFailed(
  event: WebSocketOutEvent,
): event is WebSocketAuthenticationFailed {
  return event.type === 'AuthenticationFailed'
}
