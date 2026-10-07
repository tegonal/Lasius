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

import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildWebsocketUrl, fetchWsTicket, shouldDropLastMessage } from './websocket-hook-helpers'
import { ConnectionStatus } from './websocket-manager'

describe('buildWebsocketUrl', () => {
  it('appends the messaging path in the browser', () => {
    expect(buildWebsocketUrl(false, 'wss://lasius.example/backend')).toBe(
      'wss://lasius.example/backend/messaging/websocket',
    )
  })

  it('returns null on the server', () => {
    expect(buildWebsocketUrl(true, 'wss://lasius.example/backend')).toBeNull()
  })

  it('returns null without a base URL', () => {
    expect(buildWebsocketUrl(false, undefined)).toBeNull()
    expect(buildWebsocketUrl(false, null)).toBeNull()
    expect(buildWebsocketUrl(false, '')).toBeNull()
  })
})

describe('shouldDropLastMessage', () => {
  it('drops the message without focus and without a connection', () => {
    expect(shouldDropLastMessage(false, ConnectionStatus.DISCONNECTED)).toBe(true)
    expect(shouldDropLastMessage(false, ConnectionStatus.ERROR)).toBe(true)
    expect(shouldDropLastMessage(false, ConnectionStatus.CONNECTING)).toBe(true)
  })

  it('keeps the message while connected', () => {
    expect(shouldDropLastMessage(false, ConnectionStatus.CONNECTED)).toBe(false)
  })

  it('keeps the message while the window has focus', () => {
    expect(shouldDropLastMessage(true, ConnectionStatus.DISCONNECTED)).toBe(false)
  })
})

describe('fetchWsTicket', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the ticket from the ticket route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ticket: 't-1' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchWsTicket()).resolves.toBe('t-1')
    expect(fetchMock).toHaveBeenCalledWith('/api/ws-ticket')
  })

  it('throws when the route returns no ticket', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ticket: null })))

    await expect(fetchWsTicket()).rejects.toThrow('No ticket received')
  })
})
