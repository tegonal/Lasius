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

import {
  authHeaders,
  type AuthResult,
  mergeAuthHeaders,
  oauthCallbackUrl,
  redirectIfSignedIn,
  requireUser,
} from './auth-helpers.server'
import { createUserSession } from './session.server'
import { type LasiusSessionData } from './types'

/** Call requireUser without a session cookie and return the Location of the login redirect. */
async function loginRedirectLocation(requestUrl: string, routeUrl: string) {
  try {
    await requireUser(new Request(requestUrl), new URL(routeUrl))
  } catch (error) {
    return error instanceof Response ? error.headers.get('Location') : null
  }
  return null
}

const mockSession: LasiusSessionData = {
  accessToken: 'test-access-token',
  email: 'test@example.com',
  expiresAt: Date.now() + 3_600_000,
  issuedAt: Date.now(),
  refreshToken: 'test-refresh-token',
  tokenIssuer: 'keycloak',
  userId: 'user-123',
}

describe('authHeaders', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns Authorization and X-Token-Issuer headers', () => {
    const headers = authHeaders(mockSession)
    expect(headers).toEqual({
      Authorization: 'Bearer test-access-token',
      'X-Token-Issuer': 'keycloak',
    })
  })

  it('uses the correct token issuer for internal provider', () => {
    const internalSession: LasiusSessionData = {
      ...mockSession,
      tokenIssuer: 'internal',
    }
    const headers = authHeaders(internalSession)
    expect(headers['X-Token-Issuer']).toBe('internal')
  })

  // backend/conf/all_providers.conf holds these issuer URLs for the opaque tokens.
  it('sends the GitHub issuer URL for a GitHub token', () => {
    const headers = authHeaders({ ...mockSession, tokenIssuer: 'github' })
    expect(headers['X-Token-Issuer']).toBe('https://api.github.com/')
  })

  it('sends the default GitLab issuer URL for a GitLab token', () => {
    vi.stubEnv('GITLAB_OAUTH_URL', undefined)
    const headers = authHeaders({ ...mockSession, tokenIssuer: 'gitlab' })
    expect(headers['X-Token-Issuer']).toBe('https://gitlab.com')
  })

  it('sends GITLAB_OAUTH_URL for a GitLab token on a self-hosted instance', () => {
    vi.stubEnv('GITLAB_OAUTH_URL', 'https://gitlab.example.com')
    const headers = authHeaders({ ...mockSession, tokenIssuer: 'gitlab' })
    expect(headers['X-Token-Issuer']).toBe('https://gitlab.example.com')
  })
})

describe('mergeAuthHeaders', () => {
  it('returns empty headers when authResult has no headers', () => {
    const authResult: AuthResult = { session: mockSession }
    const merged = mergeAuthHeaders(authResult)
    expect(merged.get('Set-Cookie')).toBeNull()
  })

  it('propagates Set-Cookie from Headers instance', () => {
    const cookieHeaders = new Headers({
      'Set-Cookie': 'session=abc123',
    })
    const authResult: AuthResult = {
      headers: cookieHeaders,
      session: mockSession,
    }
    const merged = mergeAuthHeaders(authResult)
    expect(merged.get('Set-Cookie')).toBe('session=abc123')
  })

  it('propagates Set-Cookie from plain object', () => {
    const authResult: AuthResult = {
      headers: { 'Set-Cookie': 'session=abc123' },
      session: mockSession,
    }
    const merged = mergeAuthHeaders(authResult)
    expect(merged.get('Set-Cookie')).toBe('session=abc123')
  })

  it('preserves existing response headers', () => {
    const authResult: AuthResult = {
      headers: { 'Set-Cookie': 'session=abc123' },
      session: mockSession,
    }
    const merged = mergeAuthHeaders(authResult, {
      'Content-Type': 'application/json',
    })
    expect(merged.get('Content-Type')).toBe('application/json')
    expect(merged.get('Set-Cookie')).toBe('session=abc123')
  })
})

describe('oauthCallbackUrl', () => {
  it('takes the public origin from the forwarded headers', () => {
    const request = new Request('http://127.0.0.1:5173/oauth/keycloak/login', {
      headers: { 'x-forwarded-host': 'lasius.example', 'x-forwarded-proto': 'https' },
    })
    expect(oauthCallbackUrl(request)).toBe('https://lasius.example/oauth/callback')
  })

  it('uses the request origin without forwarded headers', () => {
    const request = new Request('http://localhost:5173/oauth/callback?code=x')
    expect(oauthCallbackUrl(request)).toBe('http://localhost:5173/oauth/callback')
  })
})

describe('redirectIfSignedIn', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  async function signedInRequest(): Promise<Request> {
    const response = await createUserSession(mockSession, '/')
    const cookie = (response.headers.get('Set-Cookie') ?? '').split(';', 1)[0] ?? ''
    return new Request('http://localhost/login', { headers: { Cookie: cookie } })
  }

  async function redirectLocation(request: Request, returnTo: string) {
    try {
      await redirectIfSignedIn(request, returnTo)
    } catch (error) {
      return error instanceof Response ? error.headers.get('Location') : null
    }
    return null
  }

  it('sends a signed-in user to the sanitized returnTo', async () => {
    vi.stubEnv('AUTH_SECRET', 'test-secret')
    const request = await signedInRequest()
    expect(await redirectLocation(request, '/\t/example.com')).toBe('/')
    expect(await redirectLocation(request, '/user/lists?from=2026-10-01')).toBe(
      '/user/lists?from=2026-10-01',
    )
  })

  it('lets a signed-out user stay on the page', async () => {
    vi.stubEnv('AUTH_SECRET', 'test-secret')
    expect(await redirectLocation(new Request('http://localhost/login'), '/user/lists')).toBeNull()
  })
})

describe('requireUser', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('takes returnTo from the route url, not from the raw data request url', async () => {
    vi.stubEnv('AUTH_SECRET', 'test-secret')
    const location = await loginRedirectLocation(
      'http://localhost/user/home.data?_routes=routes%2Fuser.home',
      'http://localhost/user/home',
    )
    expect(location).toBe('/login?returnTo=%2Fuser%2Fhome')
  })

  it('sends a resource route request to / after the sign-in', async () => {
    vi.stubEnv('AUTH_SECRET', 'test-secret')
    const location = await loginRedirectLocation(
      'http://localhost/api/proxy.data',
      'http://localhost/api/proxy',
    )
    expect(location).toBe('/login?returnTo=%2F')
  })
})
