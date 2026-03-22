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

import { logger } from '~/lib/logger'

export enum ConnectionStatus {
	CONNECTED = 'CONNECTED',
	CONNECTING = 'CONNECTING',
	DISCONNECTED = 'DISCONNECTED',
	ERROR = 'ERROR',
}

const PING_INTERVAL_MS = 5000
const MAX_RECONNECT_ATTEMPTS = 30
const MAX_BACKOFF_MS = 10000

export type WebSocketAuth = {
	token: string
	tokenIssuer?: string
}

export type WebSocketSubscriber = {
	onMessage: (data: unknown) => void
	onStatusChange: (status: ConnectionStatus) => void
}

class WebSocketManager {
	private auth: null | WebSocketAuth = null
	private intentionallyClosed = false
	private pingTimer: null | ReturnType<typeof setInterval> = null
	private reconnectAttempt = 0
	private reconnectTimer: null | ReturnType<typeof setTimeout> = null
	private status: ConnectionStatus = ConnectionStatus.DISCONNECTED
	private readonly subscribers = new Set<WebSocketSubscriber>()
	private readonly url: string
	private ws: null | WebSocket = null

	constructor(url: string) {
		this.url = url
	}

	getStatus(): ConnectionStatus {
		return this.status
	}

	/**
	 * Called on window refocus — if the socket is dead, reconnect immediately.
	 */
	reconnectNow(): void {
		if (
			this.subscribers.size > 0 &&
			(!this.ws || this.ws.readyState === WebSocket.CLOSED)
		) {
			this.clearReconnectTimer()
			this.reconnectAttempt = 0
			this.connect()
		}
	}

	send(data: unknown): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(data))
		}
	}

	/**
	 * Update auth credentials. If the socket is already open, re-authenticate immediately.
	 * Called when the token is refreshed or first becomes available.
	 */
	setAuth(auth: WebSocketAuth): void {
		this.auth = auth
		// If already connected, re-authenticate with the new token
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.sendHelloServer()
		}
	}

	subscribe(subscriber: WebSocketSubscriber): () => void {
		this.subscribers.add(subscriber)
		// Notify of current status immediately
		subscriber.onStatusChange(this.status)

		if (this.subscribers.size === 1) {
			this.connect()
		}

		return () => {
			this.subscribers.delete(subscriber)
			if (this.subscribers.size === 0) {
				this.close()
			}
		}
	}

	private clearReconnectTimer(): void {
		if (this.reconnectTimer !== null) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
	}

	private close(): void {
		this.intentionallyClosed = true
		this.clearReconnectTimer()
		this.stopPing()
		if (this.ws) {
			this.ws.onopen = null
			this.ws.onmessage = null
			this.ws.onclose = null
			this.ws.onerror = null
			if (
				this.ws.readyState === WebSocket.OPEN ||
				this.ws.readyState === WebSocket.CONNECTING
			) {
				this.ws.close(1000, 'Client closing')
			}
			this.ws = null
		}
		this.setStatus(ConnectionStatus.DISCONNECTED)
	}

	private connect(): void {
		if (
			this.ws?.readyState === WebSocket.OPEN ||
			this.ws?.readyState === WebSocket.CONNECTING
		) {
			return
		}

		this.intentionallyClosed = false
		this.setStatus(ConnectionStatus.CONNECTING)

		try {
			this.ws = createWebSocket(this.url)
		} catch (error) {
			logger.error('[WebSocketManager] Failed to create WebSocket', error)
			this.setStatus(ConnectionStatus.ERROR)
			this.scheduleReconnect()
			return
		}

		this.ws.onopen = () => {
			logger.info('[WebSocketManager] Connected')
			this.reconnectAttempt = 0
			this.setStatus(ConnectionStatus.CONNECTED)
			this.sendHelloServer()
			this.startPing()
		}

		this.ws.onmessage = (event: MessageEvent) => {
			let parsed: unknown
			try {
				parsed = JSON.parse(event.data as string)
			} catch {
				logger.warn('[WebSocketManager] Failed to parse message', event.data)
				return
			}
			for (const subscriber of this.subscribers) {
				try {
					subscriber.onMessage(parsed)
				} catch (error) {
					logger.error('[WebSocketManager] Subscriber onMessage threw', error)
				}
			}
		}

		this.ws.onclose = (event: CloseEvent) => {
			logger.info('[WebSocketManager] Closed', {
				code: event.code,
				reason: event.reason,
			})
			this.stopPing()
			this.ws = null

			if (this.intentionallyClosed) {
				this.setStatus(ConnectionStatus.DISCONNECTED)
				return
			}

			// Normal close (1000) without intention = server closed, reconnect
			this.setStatus(ConnectionStatus.DISCONNECTED)
			this.scheduleReconnect()
		}

		this.ws.onerror = (event: Event) => {
			logger.error('[WebSocketManager] Error', event)
			this.setStatus(ConnectionStatus.ERROR)
			// onclose fires after onerror — reconnect is handled there
		}
	}

	private scheduleReconnect(): void {
		if (this.intentionallyClosed || this.subscribers.size === 0) {
			return
		}

		if (this.reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
			logger.error(
				`[WebSocketManager] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached`,
			)
			this.setStatus(ConnectionStatus.ERROR)
			return
		}

		const delay = getBackoffDelay(this.reconnectAttempt)
		logger.info(
			`[WebSocketManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt + 1}/${MAX_RECONNECT_ATTEMPTS})`,
		)

		this.clearReconnectTimer()
		this.reconnectTimer = setTimeout(() => {
			this.reconnectAttempt++
			this.connect()
		}, delay)
	}

	private sendHelloServer(): void {
		if (!this.auth) {
			logger.warn(
				'[WebSocketManager] No auth credentials — skipping HelloServer',
			)
			return
		}
		logger.info('[WebSocketManager] Sending HelloServer', {
			hasToken: !!this.auth.token,
			tokenIssuer: this.auth.tokenIssuer,
		})
		this.send({
			client: 'lasius-rr7-frontend',
			token: this.auth.token,
			tokenIssuer: this.auth.tokenIssuer,
			type: 'HelloServer',
		})
	}

	private setStatus(status: ConnectionStatus): void {
		if (this.status === status) return
		this.status = status
		for (const subscriber of this.subscribers) {
			try {
				subscriber.onStatusChange(status)
			} catch (error) {
				logger.error(
					'[WebSocketManager] Subscriber onStatusChange threw',
					error,
				)
			}
		}
	}

	private startPing(): void {
		this.stopPing()
		this.pingTimer = setInterval(() => {
			this.send({ type: 'Ping' })
		}, PING_INTERVAL_MS)
	}

	private stopPing(): void {
		if (this.pingTimer !== null) {
			clearInterval(this.pingTimer)
			this.pingTimer = null
		}
	}
}

/**
 * Creates a WebSocket instance for the given URL.
 * Isolated as a factory so auth strategy (cookie vs token) can be swapped in one place.
 */
function createWebSocket(url: string): WebSocket {
	return new WebSocket(url)
}

function getBackoffDelay(attempt: number): number {
	return Math.min(Math.pow(2, attempt) * 1000, MAX_BACKOFF_MS)
}

/**
 * Module-level registry of managers keyed by URL.
 * Ensures one WebSocket connection per unique URL across the entire app.
 *
 * In development, Vite HMR re-executes this module on every hot update,
 * which would orphan existing WebSocket connections. We use import.meta.hot
 * to carry the Map across reloads so existing connections are reused.
 */
let managers = new Map<string, WebSocketManager>()

if (import.meta.hot) {
	const prev = import.meta.hot.data?.managers as
		| Map<string, WebSocketManager>
		| undefined
	if (prev) {
		managers = prev
	}
	import.meta.hot.dispose((data) => {
		data.managers = managers
	})
}

export function getWebSocketManager(url: string): WebSocketManager {
	let manager = managers.get(url)
	if (!manager) {
		manager = new WebSocketManager(url)
		managers.set(url, manager)
	}
	return manager
}

export { getBackoffDelay as _getBackoffDelay }
