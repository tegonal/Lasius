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

import { stringHash } from '~/lib/utils/string-hash'
import { type WebSocketOutEvent } from '~/services/api/lasius/webSocketOutEvent'

export function isWebSocketOutEvent(data?: unknown): data is WebSocketOutEvent {
  return typeof data === 'object' && data !== null && 'type' in data
}

// The socket can deliver the same message again after a re-render, so the hash skips a repeat.
export const getNewOutEvent = (
  message: unknown,
  previousHash: null | string,
): null | { event: WebSocketOutEvent; hash: string } => {
  if (!isWebSocketOutEvent(message)) return null
  const hash = stringHash(message)
  return hash === previousHash ? null : { event: message, hash }
}
