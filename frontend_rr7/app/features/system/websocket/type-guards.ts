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

import { type WebSocketAuthenticationFailed } from '~/services/api/lasius/webSocketAuthenticationFailed'
import { type WebSocketCurrentOrganisationTimeBookings } from '~/services/api/lasius/webSocketCurrentOrganisationTimeBookings'
import { type WebSocketCurrentUserTimeBookingEvent } from '~/services/api/lasius/webSocketCurrentUserTimeBookingEvent'
import { type WebSocketFavoriteAdded } from '~/services/api/lasius/webSocketFavoriteAdded'
import { type WebSocketFavoriteRemoved } from '~/services/api/lasius/webSocketFavoriteRemoved'
import { type WebSocketIssueImporterSyncStatsChanged } from '~/services/api/lasius/webSocketIssueImporterSyncStatsChanged'
import { type WebSocketLatestTimeBooking } from '~/services/api/lasius/webSocketLatestTimeBooking'
import { type WebSocketOutEvent } from '~/services/api/lasius/webSocketOutEvent'
import { type WebSocketUserTimeBookingHistoryEntryAdded } from '~/services/api/lasius/webSocketUserTimeBookingHistoryEntryAdded'
import { type WebSocketUserTimeBookingHistoryEntryChanged } from '~/services/api/lasius/webSocketUserTimeBookingHistoryEntryChanged'
import { type WebSocketUserTimeBookingHistoryEntryCleaned } from '~/services/api/lasius/webSocketUserTimeBookingHistoryEntryCleaned'
import { type WebSocketUserTimeBookingHistoryEntryRemoved } from '~/services/api/lasius/webSocketUserTimeBookingHistoryEntryRemoved'

export type WebSocketEventHandler<T extends WebSocketOutEvent> = {
	handler: (event: T) => void
	typeGuard: (event: WebSocketOutEvent) => event is T
}

export function isAuthenticationFailed(
	event: WebSocketOutEvent,
): event is WebSocketAuthenticationFailed {
	return event.type === 'AuthenticationFailed'
}

export function isCurrentOrganisationTimeBookings(
	event: WebSocketOutEvent,
): event is WebSocketCurrentOrganisationTimeBookings {
	return event.type === 'CurrentOrganisationTimeBookings'
}

export function isCurrentUserTimeBookingEvent(
	event: WebSocketOutEvent,
): event is WebSocketCurrentUserTimeBookingEvent {
	return event.type === 'CurrentUserTimeBookingEvent'
}

export function isFavoriteAdded(
	event: WebSocketOutEvent,
): event is WebSocketFavoriteAdded {
	return event.type === 'FavoriteAdded'
}

export function isFavoriteRemoved(
	event: WebSocketOutEvent,
): event is WebSocketFavoriteRemoved {
	return event.type === 'FavoriteRemoved'
}

export function isIssueImporterSyncStatsChanged(
	event: WebSocketOutEvent,
): event is WebSocketIssueImporterSyncStatsChanged {
	return event.type === 'IssueImporterSyncStatsChanged'
}

export function isLatestTimeBooking(
	event: WebSocketOutEvent,
): event is WebSocketLatestTimeBooking {
	return event.type === 'LatestTimeBooking'
}

export function isUserTimeBookingHistoryEntryAdded(
	event: WebSocketOutEvent,
): event is WebSocketUserTimeBookingHistoryEntryAdded {
	return event.type === 'UserTimeBookingHistoryEntryAdded'
}

export function isUserTimeBookingHistoryEntryChanged(
	event: WebSocketOutEvent,
): event is WebSocketUserTimeBookingHistoryEntryChanged {
	return event.type === 'UserTimeBookingHistoryEntryChanged'
}

export function isUserTimeBookingHistoryEntryCleaned(
	event: WebSocketOutEvent,
): event is WebSocketUserTimeBookingHistoryEntryCleaned {
	return event.type === 'UserTimeBookingHistoryEntryCleaned'
}

export function isUserTimeBookingHistoryEntryRemoved(
	event: WebSocketOutEvent,
): event is WebSocketUserTimeBookingHistoryEntryRemoved {
	return event.type === 'UserTimeBookingHistoryEntryRemoved'
}

export function isWebSocketOutEvent(data: unknown): data is WebSocketOutEvent {
	return typeof data === 'object' && data !== null && 'type' in data
}

export function processWebSocketEvent(
	message: unknown,
	handlers: WebSocketEventHandler<any>[],
): boolean {
	if (!isWebSocketOutEvent(message)) {
		return false
	}

	for (const { handler, typeGuard } of handlers) {
		if (typeGuard(message)) {
			handler(message)
			return true
		}
	}
	return false
}
