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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { WS_MAX_RECONNECT_ATTEMPTS, WS_PING_INTERVAL_MS } from '~/config/constants'

import {
  _getBackoffDelay,
  ConnectionStatus,
  getWebSocketManager,
  type WebSocketSubscriber,
} from './websocket-manager'

describe('getBackoffDelay', () => {
  it('returns 1000ms for attempt 0', () => {
    expect(_getBackoffDelay(0)).toBe(1000)
  })

  it('returns 2000ms for attempt 1', () => {
    expect(_getBackoffDelay(1)).toBe(2000)
  })

  it('returns 4000ms for attempt 2', () => {
    expect(_getBackoffDelay(2)).toBe(4000)
  })

  it('returns 8000ms for attempt 3', () => {
    expect(_getBackoffDelay(3)).toBe(8000)
  })

  it('caps at 10000ms for attempt 4+', () => {
    expect(_getBackoffDelay(4)).toBe(10_000)
    expect(_getBackoffDelay(5)).toBe(10_000)
    expect(_getBackoffDelay(10)).toBe(10_000)
    expect(_getBackoffDelay(29)).toBe(10_000)
  })
})

type Listener = (event: unknown) => void

class FakeWebSocket {
  static CLOSED = 3
  static CLOSING = 2
  static CONNECTING = 0
  static instances: FakeWebSocket[] = []
  static OPEN = 1

  closeCalls: { code?: number; reason?: string }[] = []
  onerror: ((event: unknown) => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  readyState = FakeWebSocket.CONNECTING
  sent: unknown[] = []
  readonly url: string
  private readonly listeners = new Map<string, Listener[]>()

  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
  }

  addEventListener(type: string, listener: Listener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener])
  }

  // A real socket fires its close event later, so close() only changes the state.
  close(code?: number, reason?: string) {
    this.closeCalls.push({ code, reason })
    this.readyState = FakeWebSocket.CLOSING
  }

  fireClose(code = 1006, reason = '') {
    this.readyState = FakeWebSocket.CLOSED
    this.dispatch('close', { code, reason })
  }

  fireMessage(data: string) {
    this.onmessage?.({ data })
  }

  fireOpen() {
    this.readyState = FakeWebSocket.OPEN
    this.dispatch('open', {})
  }

  send(data: string) {
    this.sent.push(JSON.parse(data))
  }

  private dispatch(type: string, event: unknown) {
    const listeners = this.listeners.get(type) ?? []
    for (const listener of listeners) listener(event)
  }
}

// getWebSocketManager keeps one manager per URL for the module lifetime, so each test uses a new URL.
const nextUrl = () => `wss://test.example/${crypto.randomUUID()}`

const createSubscriber = () => {
  const statuses: ConnectionStatus[] = []
  const messages: unknown[] = []
  const subscriber: WebSocketSubscriber = {
    onMessage: (data) => {
      messages.push(data)
    },
    onStatusChange: (status) => {
      statuses.push(status)
    },
  }
  return { messages, statuses, subscriber }
}

const lastSocket = () => {
  const socket = FakeWebSocket.instances.at(-1)
  if (!socket) throw new Error('No socket created')
  return socket
}

describe('WebSocketManager', () => {
  beforeEach(() => {
    FakeWebSocket.instances = []
    vi.useFakeTimers()
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('ignores the late close event of a socket replaced after an unsubscribe and subscribe', () => {
    const manager = getWebSocketManager(nextUrl())
    const unsubscribe = manager.subscribe(createSubscriber().subscriber)
    const oldSocket = lastSocket()

    unsubscribe()
    manager.subscribe(createSubscriber().subscriber)
    const newSocket = lastSocket()
    expect(newSocket).not.toBe(oldSocket)

    oldSocket.fireClose(1000, 'Client closing')
    vi.advanceTimersByTime(60_000)

    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(manager.getStatus()).toBe(ConnectionStatus.CONNECTING)
    newSocket.fireOpen()
    expect(manager.getStatus()).toBe(ConnectionStatus.CONNECTED)
  })

  it('opens a socket for the first subscriber and reports CONNECTING', () => {
    const url = nextUrl()
    const manager = getWebSocketManager(url)
    const { statuses, subscriber } = createSubscriber()

    manager.subscribe(subscriber)

    expect(FakeWebSocket.instances).toHaveLength(1)
    expect(lastSocket().url).toBe(url)
    expect(statuses).toEqual([ConnectionStatus.DISCONNECTED, ConnectionStatus.CONNECTING])
  })

  it('opens only one socket for a second subscriber', () => {
    const manager = getWebSocketManager(nextUrl())
    manager.subscribe(createSubscriber().subscriber)
    const second = createSubscriber()

    manager.subscribe(second.subscriber)

    expect(FakeWebSocket.instances).toHaveLength(1)
    expect(second.statuses).toEqual([ConnectionStatus.CONNECTING])
  })

  it('reports CONNECTED on open and sends HelloServer with the ticket', async () => {
    const manager = getWebSocketManager(nextUrl())
    manager.setTicketFetcher(() => Promise.resolve('ticket-1'))
    manager.subscribe(createSubscriber().subscriber)

    lastSocket().fireOpen()
    await vi.waitFor(() => expect(lastSocket().sent).toHaveLength(1))

    expect(manager.getStatus()).toBe(ConnectionStatus.CONNECTED)
    expect(lastSocket().sent[0]).toEqual({
      client: 'lasius-rr7-frontend',
      token: 'ticket-1',
      type: 'HelloServer',
    })
  })

  it('skips HelloServer without a ticket fetcher', async () => {
    const manager = getWebSocketManager(nextUrl())
    manager.subscribe(createSubscriber().subscriber)

    lastSocket().fireOpen()
    await Promise.resolve()

    expect(lastSocket().sent).toEqual([])
  })

  it('sends no HelloServer when the ticket fetch fails', async () => {
    const manager = getWebSocketManager(nextUrl())
    const fetcher = vi.fn(() => Promise.reject(new Error('no ticket')))
    manager.setTicketFetcher(fetcher)
    manager.subscribe(createSubscriber().subscriber)

    lastSocket().fireOpen()
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalled())
    await Promise.resolve()

    expect(lastSocket().sent).toEqual([])
  })

  it('sends a Ping after each ping interval', () => {
    const manager = getWebSocketManager(nextUrl())
    manager.subscribe(createSubscriber().subscriber)
    lastSocket().fireOpen()

    vi.advanceTimersByTime(WS_PING_INTERVAL_MS)

    expect(lastSocket().sent).toEqual([{ type: 'Ping' }])
  })

  it('passes each parsed message to every subscriber and drops a bad JSON message', () => {
    const manager = getWebSocketManager(nextUrl())
    const first = createSubscriber()
    const second = createSubscriber()
    manager.subscribe(first.subscriber)
    manager.subscribe(second.subscriber)
    lastSocket().fireOpen()

    lastSocket().fireMessage('{"type":"Pong"}')
    lastSocket().fireMessage('not json')

    expect(first.messages).toEqual([{ type: 'Pong' }])
    expect(second.messages).toEqual([{ type: 'Pong' }])
  })

  it('keeps the fan-out when one subscriber throws', () => {
    const manager = getWebSocketManager(nextUrl())
    manager.subscribe({
      onMessage: () => {
        throw new Error('boom')
      },
      onStatusChange: () => {},
    })
    const second = createSubscriber()
    manager.subscribe(second.subscriber)

    lastSocket().fireMessage('{"a":1}')

    expect(second.messages).toEqual([{ a: 1 }])
  })

  it('reports ERROR on a socket error', () => {
    const manager = getWebSocketManager(nextUrl())
    manager.subscribe(createSubscriber().subscriber)

    lastSocket().onerror?.({})

    expect(manager.getStatus()).toBe(ConnectionStatus.ERROR)
  })

  it('reconnects with backoff after an unintentional close', () => {
    const manager = getWebSocketManager(nextUrl())
    manager.subscribe(createSubscriber().subscriber)

    lastSocket().fireClose()
    expect(manager.getStatus()).toBe(ConnectionStatus.DISCONNECTED)

    vi.advanceTimersByTime(_getBackoffDelay(0) - 1)
    expect(FakeWebSocket.instances).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(FakeWebSocket.instances).toHaveLength(2)

    lastSocket().fireClose()
    vi.advanceTimersByTime(_getBackoffDelay(1) - 1)
    expect(FakeWebSocket.instances).toHaveLength(2)
    vi.advanceTimersByTime(1)
    expect(FakeWebSocket.instances).toHaveLength(3)
  })

  it('resets the backoff after a successful open', () => {
    const manager = getWebSocketManager(nextUrl())
    manager.subscribe(createSubscriber().subscriber)
    lastSocket().fireClose()
    vi.advanceTimersByTime(_getBackoffDelay(0))
    lastSocket().fireOpen()

    lastSocket().fireClose()
    vi.advanceTimersByTime(_getBackoffDelay(0))

    expect(FakeWebSocket.instances).toHaveLength(3)
  })

  it('reports ERROR after the maximum reconnect attempts', () => {
    const manager = getWebSocketManager(nextUrl())
    manager.subscribe(createSubscriber().subscriber)

    for (let attempt = 0; attempt < WS_MAX_RECONNECT_ATTEMPTS; attempt++) {
      lastSocket().fireClose()
      vi.advanceTimersByTime(_getBackoffDelay(attempt))
    }
    lastSocket().fireClose()
    vi.advanceTimersByTime(60_000)

    expect(FakeWebSocket.instances).toHaveLength(WS_MAX_RECONNECT_ATTEMPTS + 1)
    expect(manager.getStatus()).toBe(ConnectionStatus.ERROR)
  })

  it('reports ERROR and reconnects when the WebSocket constructor throws', () => {
    const manager = getWebSocketManager(nextUrl())
    let calls = 0
    vi.stubGlobal(
      'WebSocket',
      class extends FakeWebSocket {
        constructor(url: string) {
          calls++
          if (calls === 1) throw new Error('blocked')
          super(url)
        }
      },
    )

    manager.subscribe(createSubscriber().subscriber)
    expect(manager.getStatus()).toBe(ConnectionStatus.ERROR)

    vi.advanceTimersByTime(_getBackoffDelay(0))
    expect(FakeWebSocket.instances).toHaveLength(1)
    expect(manager.getStatus()).toBe(ConnectionStatus.CONNECTING)
  })

  it('closes the socket with 1000 and reports DISCONNECTED after the last unsubscribe', () => {
    const manager = getWebSocketManager(nextUrl())
    const first = manager.subscribe(createSubscriber().subscriber)
    const second = manager.subscribe(createSubscriber().subscriber)
    lastSocket().fireOpen()

    first()
    expect(lastSocket().closeCalls).toEqual([])

    second()
    expect(lastSocket().closeCalls).toEqual([{ code: 1000, reason: 'Client closing' }])
    expect(manager.getStatus()).toBe(ConnectionStatus.DISCONNECTED)

    lastSocket().fireClose(1000)
    vi.advanceTimersByTime(60_000)
    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('reconnects at once on reconnectNow only when the socket is dead', () => {
    const manager = getWebSocketManager(nextUrl())
    manager.subscribe(createSubscriber().subscriber)

    manager.reconnectNow()
    expect(FakeWebSocket.instances).toHaveLength(1)

    lastSocket().fireOpen()
    manager.reconnectNow()
    expect(FakeWebSocket.instances).toHaveLength(1)

    lastSocket().fireClose()
    manager.reconnectNow()
    expect(FakeWebSocket.instances).toHaveLength(2)
  })

  it('does nothing on reconnectNow without subscribers', () => {
    const manager = getWebSocketManager(nextUrl())

    manager.reconnectNow()

    expect(FakeWebSocket.instances).toHaveLength(0)
  })

  it('sends nothing while the socket is not open', () => {
    const manager = getWebSocketManager(nextUrl())
    manager.subscribe(createSubscriber().subscriber)

    manager.send({ type: 'Ping' })

    expect(lastSocket().sent).toEqual([])
  })

  it('returns the same manager for the same URL', () => {
    const url = nextUrl()
    expect(getWebSocketManager(url)).toBe(getWebSocketManager(url))
  })
})
