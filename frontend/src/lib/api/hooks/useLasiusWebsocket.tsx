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

import useIsWindowFocused from 'lib/hooks/useIsWindowFocused'
import { logger } from 'lib/logger'
import parseJson from 'parse-json'
import { CONNECTION_STATUS, IS_SERVER, LASIUS_API_WEBSOCKET_URL } from 'projectConfig/constants'
import { useEffect, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'

/**
 * Custom hook for managing WebSocket connection to the Lasius backend.
 * Provides real-time bidirectional communication for live updates of bookings,
 * user events, and system notifications with automatic reconnection handling.
 *
 * @returns Object containing:
 *   - sendJsonMessage: Function to send JSON messages to the WebSocket server
 *   - lastMessage: Most recent parsed message received from the server (null if none)
 *   - connectionStatus: Current connection status (CONNECTING, CONNECTED, DISCONNECTED, ERROR)
 *   - messageHistory: Array of all MessageEvent objects received during the session
 *
 * @example
 * const { sendJsonMessage, lastMessage, connectionStatus } = useLasiusWebsocket()
 *
 * // Send a message
 * sendJsonMessage({ type: 'BOOKING_UPDATE', data: bookingData })
 *
 * // React to received messages
 * useEffect(() => {
 *   if (lastMessage?.type === 'BOOKING_STARTED') {
 *     console.log('New booking started:', lastMessage.data)
 *   }
 * }, [lastMessage])
 *
 * // Display connection status
 * if (connectionStatus === CONNECTION_STATUS.DISCONNECTED) {
 *   return <ConnectionError />
 * }
 *
 * @remarks
 * - Automatically reconnects with exponential backoff (max 10s between attempts)
 * - Makes up to 30 reconnection attempts before giving up
 * - Clears message history when window loses focus and disconnects
 * - Shares WebSocket connection across components for efficiency
 * - Only initializes on client-side (not during SSR)
 * - Automatically parses incoming messages as JSON
 * - Logs connection events for debugging purposes
 * - Connection status maps ReadyState to human-readable CONNECTION_STATUS values
 */
export const useLasiusWebsocket = () => {
  const isWindowFocused = useIsWindowFocused()

  const [messageHistory, setMessageHistory] = useState<MessageEvent<any>[]>([])

  const websocketUrl = IS_SERVER ? null : `${LASIUS_API_WEBSOCKET_URL}/messaging/websocket`
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(websocketUrl, {
    share: true,
    shouldReconnect: (closeEvent) => {
      logger.warn('[useLasiusWebsocket][shouldReconnect]', closeEvent)
      return true
    },
    retryOnError: true,
    //exponential backoff reconnect interval
    reconnectInterval: (attemptNumber) => Math.min(Math.pow(2, attemptNumber) * 1000, 10000),
    reconnectAttempts: 30,
  })

  useEffect(() => {
    if (isWindowFocused && readyState === ReadyState.OPEN) {
      logger.info('[useLasiusWebsocket][onReturn][connected]')
    }
    if (isWindowFocused && readyState !== ReadyState.OPEN) {
      logger.info('[useLasiusWebsocket][onReturn][disconnected]')
      setMessageHistory([])
    }
  }, [isWindowFocused, readyState])

  useEffect(() => {
    if (lastMessage !== null) {
      setMessageHistory((prev) => [...prev, lastMessage])
    }
  }, [lastMessage, setMessageHistory])

  const connectionStatus = {
    [ReadyState.CONNECTING]: CONNECTION_STATUS.CONNECTING,
    [ReadyState.OPEN]: CONNECTION_STATUS.CONNECTED,
    [ReadyState.CLOSING]: CONNECTION_STATUS.DISCONNECTED,
    [ReadyState.CLOSED]: CONNECTION_STATUS.ERROR,
    [ReadyState.UNINSTANTIATED]: CONNECTION_STATUS.ERROR,
  }[readyState]

  return {
    sendJsonMessage,
    lastMessage: lastMessage?.data ? parseJson(lastMessage?.data) : null,
    connectionStatus,
    messageHistory,
  }
}
