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

import { createGitHubProvider } from './github.server'
import { createGitLabProvider } from './gitlab.server'
import { createInternalProvider } from './internal.server'
import { createKeycloakProvider } from './keycloak.server'

const tokens = { accessToken: 'the-access-token', refreshToken: 'the-refresh-token' }

const fetchMock = vi.fn()

/** The URL and the body text of the single fetch call. */
function sentRequest(): { body: string; headers: Record<string, string>; url: string } {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  const { body } = init
  return {
    body: body instanceof URLSearchParams ? body.toString() : typeof body === 'string' ? body : '',
    headers: init.headers as Record<string, string>,
    url,
  }
}

describe('revokeToken of each provider', () => {
  beforeEach(() => {
    vi.stubEnv('LASIUS_OAUTH_CLIENT_ID', 'lasius-client')
    vi.stubEnv('LASIUS_OAUTH_CLIENT_SECRET', 'lasius-secret')
    vi.stubEnv('LASIUS_API_URL', 'https://backend.test/backend')
    vi.stubEnv('KEYCLOAK_OAUTH_CLIENT_ID', 'kc-client')
    vi.stubEnv('KEYCLOAK_OAUTH_CLIENT_SECRET', 'kc-secret')
    vi.stubEnv('KEYCLOAK_OAUTH_URL', 'https://keycloak.test/realms/lasius')
    vi.stubEnv('GITLAB_OAUTH_CLIENT_ID', 'gl-client')
    vi.stubEnv('GITLAB_OAUTH_CLIENT_SECRET', 'gl-secret')
    vi.stubEnv('GITHUB_OAUTH_CLIENT_ID', 'gh-client')
    vi.stubEnv('GITHUB_OAUTH_CLIENT_SECRET', 'gh-secret')
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  // The backend logout checks the Bearer token as an access token (OAuth2Controller.logout).
  it('internal: sends the access token to the backend logout', async () => {
    await createInternalProvider().revokeToken(tokens)
    const request = sentRequest()
    expect(request.url).toBe('https://backend.test/backend/oauth2/logout')
    expect(request.headers.Authorization).toBe('Bearer the-access-token')
  })

  it('keycloak: revokes the refresh token', async () => {
    await createKeycloakProvider().revokeToken(tokens)
    expect(new URLSearchParams(sentRequest().body).get('token')).toBe('the-refresh-token')
  })

  it('gitlab: revokes the refresh token', async () => {
    await createGitLabProvider().revokeToken(tokens)
    expect(new URLSearchParams(sentRequest().body).get('token')).toBe('the-refresh-token')
  })

  it('github: revokes the access token, because GitHub issues no refresh token', async () => {
    await createGitHubProvider().revokeToken(tokens)
    expect(JSON.parse(sentRequest().body)).toEqual({ access_token: 'the-access-token' })
  })

  it('throws when the provider rejects the request', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }))
    await expect(createInternalProvider().revokeToken(tokens)).rejects.toThrow('403')
    await expect(createKeycloakProvider().revokeToken(tokens)).rejects.toThrow('403')
    await expect(createGitLabProvider().revokeToken(tokens)).rejects.toThrow('403')
    await expect(createGitHubProvider().revokeToken(tokens)).rejects.toThrow('403')
  })
})
