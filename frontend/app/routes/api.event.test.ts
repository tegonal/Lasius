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

import { RouterContextProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { action } from './api.event'

const fetchMock = vi.fn<typeof fetch>()

const post = (body: unknown, headers: Record<string, string> = {}) => {
  const request = new Request('http://localhost/api/event', {
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'user-agent': 'Mozilla/5.0 Test', ...headers },
    method: 'POST',
  })
  return action({
    context: new RouterContextProvider(),
    params: {},
    pattern: '/api/event',
    request,
    url: new URL(request.url),
  })
}

const sentRequest = () => {
  const [url, init] = fetchMock.mock.calls[0] ?? []
  const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
  return {
    body,
    headers: new Headers(init?.headers),
    url: url instanceof URL ? url.href : url,
  }
}

describe('api.event action', () => {
  beforeEach(() => {
    vi.stubEnv('LASIUS_TELEMETRY_PLAUSIBLE_HOST', 'https://plausible.example')
    vi.stubEnv('LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN', 'time.example')
    fetchMock.mockResolvedValue(new Response('ok', { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('sends a page view with the route pattern under the configured domain', async () => {
    const response = await post({ path: '/join/:invitationId', referrer: 'https://a.example/' })

    expect(response.status).toBe(202)
    const sent = sentRequest()
    expect(sent.url).toBe('https://plausible.example/api/event')
    expect(sent.body).toEqual({
      domain: 'time.example',
      name: 'pageview',
      referrer: 'https://a.example/',
      url: 'https://time.example/join/:invitationId',
    })
    expect(sent.headers.get('user-agent')).toBe('Mozilla/5.0 Test')
  })

  it('sends the last X-Forwarded-For entry as X-Plausible-IP', async () => {
    await post(
      { path: '/user/home' },
      { 'x-client-ip': '198.51.100.9', 'x-forwarded-for': '198.51.100.1, 203.0.113.7' },
    )

    const { headers } = sentRequest()
    expect(headers.get('x-plausible-ip')).toBe('203.0.113.7')
    expect(headers.has('x-forwarded-for')).toBe(false)
  })

  it('omits X-Plausible-IP without a proxy in front', async () => {
    await post({ path: '/user/home' })

    expect(sentRequest().headers.has('x-plausible-ip')).toBe(false)
  })

  it('sends nothing when Plausible is not configured', async () => {
    vi.stubEnv('LASIUS_TELEMETRY_PLAUSIBLE_HOST', '')

    const response = await post({ path: '/user/home' })

    expect(response.status).toBe(204)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    ['a body that is not JSON', '{'],
    ['a path without a leading slash', { path: 'https://evil.example/' }],
    ['a missing path', { referrer: 'https://a.example/' }],
  ])('answers 400 for %s', async (_case, body) => {
    const response = await post(body)

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('answers 202 when Plausible is unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))

    const response = await post({ path: '/user/home' })

    expect(response.status).toBe(202)
  })
})
