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
import { describe, expect, it, vi } from 'vitest'

import { action } from './api.proxy'

/** Posts the body to the action. These cases answer before the auth check. */
async function post(body: string) {
  const request = new Request('http://localhost/api/proxy', { body, method: 'POST' })
  return action({
    context: new RouterContextProvider(),
    params: {},
    pattern: '/api/proxy',
    request,
    url: new URL(request.url),
  })
}

describe('api.proxy action', () => {
  it.each([
    ['a body that is not JSON', 'not json'],
    ['an empty body', ''],
    ['a payload that fails the schema', JSON.stringify({ method: 'TRACE', url: '/user/profile' })],
    ['an absolute URL', JSON.stringify({ method: 'GET', url: 'https://example.com/steal' })],
  ])('answers 400 with the error envelope for %s', async (_case, body) => {
    const result = await post(body)
    expect(result.init?.status).toBe(400)
    expect(result.data).toMatchObject({ ok: false, status: 400 })
  })

  it('answers a backend 403 with the 403 envelope and the reason', async () => {
    const backend = new Response('not_org_admin', { status: 403, statusText: 'Forbidden' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(backend))
    try {
      const result = await post(JSON.stringify({ method: 'GET', skipAuth: true, url: '/projects' }))
      expect(result.init?.status).toBe(403)
      expect(result.data).toEqual({ error: 'not_org_admin', ok: false, status: 403 })
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
