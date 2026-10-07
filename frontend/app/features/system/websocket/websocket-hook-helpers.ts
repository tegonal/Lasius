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

import { ConnectionStatus } from './websocket-manager'

/**
 * The messaging endpoint for the backend WebSocket base URL, or null where no socket may open.
 */
export function buildWebsocketUrl(isServer: boolean, baseUrl: null | string | undefined) {
  if (isServer || !baseUrl) return null
  return `${baseUrl}/messaging/websocket`
}

/**
 * Fetches a single-use ticket for the HelloServer message of the WebSocket.
 */
export async function fetchWsTicket(): Promise<string> {
  const response = await fetch('/api/ws-ticket')
  const body: { ticket: null | string } = await response.json()
  if (!body.ticket) throw new Error('No ticket received')
  return body.ticket
}

/**
 * The last message is stale when the window has no focus and no live connection.
 */
export function shouldDropLastMessage(isFocused: boolean, status: ConnectionStatus) {
  return !isFocused && status !== ConnectionStatus.CONNECTED
}
