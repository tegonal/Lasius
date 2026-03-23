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

import { useCallback, useEffect, useRef, useState } from 'react'

import { useLayoutLoaderData } from '~/hooks/use-layout-loader-data'

import { useIsWindowFocused } from './use-is-window-focused'
import {
  ConnectionStatus,
  getWebSocketManager,
  type WebSocketSubscriber,
} from './websocket-manager'

export { ConnectionStatus } from './websocket-manager'

const IS_SERVER = typeof window === 'undefined'

export function useLasiusWebsocket() {
  const isWindowFocused = useIsWindowFocused()
  const appLayoutData = useLayoutLoaderData()

  const websocketUrl =
    !IS_SERVER && appLayoutData?.websocketUrl
      ? `${appLayoutData.websocketUrl}/messaging/websocket`
      : null

  const fetchTicket = useCallback(async () => {
    const r = await fetch('/api/ws-ticket')
    const d: { ticket: null | string } = await r.json()
    if (!d.ticket) throw new Error('No ticket received')
    return d.ticket
  }, [])

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED,
  )
  const [lastMessage, setLastMessage] = useState<unknown>(null)
  const managerRef = useRef<null | ReturnType<typeof getWebSocketManager>>(null)

  const sendJsonMessage = useCallback((data: unknown) => {
    managerRef.current?.send(data)
  }, [])

  // Subscribe to the WebSocket manager
  useEffect(() => {
    if (!websocketUrl) return

    const manager = getWebSocketManager(websocketUrl)
    managerRef.current = manager

    const subscriber: WebSocketSubscriber = {
      onMessage: (data) => {
        setLastMessage(data)
      },
      onStatusChange: (status) => {
        setConnectionStatus(status)
      },
    }

    const unsubscribe = manager.subscribe(subscriber)

    return () => {
      unsubscribe()
      managerRef.current = null
    }
  }, [websocketUrl])

  // Pass ticket fetcher to the manager
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.setTicketFetcher(fetchTicket)
    }
  }, [fetchTicket])

  // Active reconnect on window refocus
  useEffect(() => {
    if (isWindowFocused && managerRef.current) {
      managerRef.current.reconnectNow()
    }
    if (!isWindowFocused && connectionStatus !== ConnectionStatus.CONNECTED) {
      setLastMessage(null)
    }
  }, [isWindowFocused, connectionStatus])

  return {
    connectionStatus,
    lastMessage,
    sendJsonMessage,
  }
}
