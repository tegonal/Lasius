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
import { useRouteLoaderData } from 'react-router'

import { useIsWindowFocused } from './use-is-window-focused'
import {
	ConnectionStatus,
	getWebSocketManager,
	type WebSocketSubscriber,
} from './websocket-manager'

export { ConnectionStatus } from './websocket-manager'

const MAX_MESSAGE_HISTORY = 100
const IS_SERVER = typeof window === 'undefined'

export function useLasiusWebsocket() {
	const isWindowFocused = useIsWindowFocused()
	const appLayoutData = useRouteLoaderData('routes/app-layout') as
		| undefined
		| {
				accessToken?: string
				tokenIssuer?: string
				websocketUrl?: string
		  }

	const websocketUrl =
		!IS_SERVER && appLayoutData?.websocketUrl
			? `${appLayoutData.websocketUrl}/messaging/websocket`
			: null

	const accessToken = appLayoutData?.accessToken
	const tokenIssuer = appLayoutData?.tokenIssuer

	const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
		ConnectionStatus.DISCONNECTED,
	)
	const [lastMessage, setLastMessage] = useState<unknown>(null)
	const [messageHistory, setMessageHistory] = useState<unknown[]>([])
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
				setMessageHistory((prev) => {
					const next = [...prev, data]
					return next.length > MAX_MESSAGE_HISTORY
						? next.slice(-MAX_MESSAGE_HISTORY)
						: next
				})
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

	// Pass auth credentials to the manager (on mount and token refresh)
	useEffect(() => {
		if (managerRef.current && accessToken) {
			managerRef.current.setAuth({ token: accessToken, tokenIssuer })
		}
	}, [accessToken, tokenIssuer])

	// Active reconnect on window refocus
	useEffect(() => {
		if (isWindowFocused && managerRef.current) {
			managerRef.current.reconnectNow()
		}
		if (!isWindowFocused && connectionStatus !== ConnectionStatus.CONNECTED) {
			setMessageHistory([])
		}
	}, [isWindowFocused, connectionStatus])

	return {
		connectionStatus,
		lastMessage,
		messageHistory,
		sendJsonMessage,
	}
}
