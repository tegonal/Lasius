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
