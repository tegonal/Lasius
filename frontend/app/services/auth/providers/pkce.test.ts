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

import { type OAuthProvider } from '../types'
import { createGitHubProvider } from './github.server'
import { createGitLabProvider } from './gitlab.server'
import { createKeycloakProvider } from './keycloak.server'

const fetchMock = vi.fn()
const tokenAnswer = {
  access_token: 'at',
  expires_in: 300,
  refresh_token: 'rt',
  token_type: 'Bearer',
}

const providers: [string, () => OAuthProvider][] = [
  ['keycloak', createKeycloakProvider],
  ['gitlab', createGitLabProvider],
  ['github', createGitHubProvider],
]

describe('PKCE of the external providers', () => {
  beforeEach(() => {
    vi.stubEnv('KEYCLOAK_OAUTH_CLIENT_ID', 'kc-client')
    vi.stubEnv('KEYCLOAK_OAUTH_CLIENT_SECRET', 'kc-secret')
    vi.stubEnv('KEYCLOAK_OAUTH_URL', 'https://keycloak.test/realms/lasius')
    vi.stubEnv('GITLAB_OAUTH_CLIENT_ID', 'gl-client')
    vi.stubEnv('GITLAB_OAUTH_CLIENT_SECRET', 'gl-secret')
    vi.stubEnv('GITHUB_OAUTH_CLIENT_ID', 'gh-client')
    vi.stubEnv('GITHUB_OAUTH_CLIENT_SECRET', 'gh-secret')
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(Response.json(tokenAnswer))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it.each(providers)('%s: sends the S256 challenge in the authorization URL', (_name, create) => {
    const url = new URL(
      create().getAuthorizationUrl('the-state', 'https://app.test/cb', 'the-challenge'),
    )
    expect(url.searchParams.get('code_challenge')).toBe('the-challenge')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('state')).toBe('the-state')
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.test/cb')
  })

  it('github: throws on an error in a 200 answer', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'bad_verification_code' }))
    await expect(
      createGitHubProvider().exchangeCode('the-code', 'https://app.test/cb', 'the-verifier'),
    ).rejects.toThrow('bad_verification_code')
  })

  it.each(providers)('%s: sends the verifier with the code exchange', async (_name, create) => {
    const tokens = await create().exchangeCode('the-code', 'https://app.test/cb', 'the-verifier')
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const form = init.body
    if (!(form instanceof URLSearchParams)) throw new Error('expected a form body')
    expect(form.get('code_verifier')).toBe('the-verifier')
    expect(form.get('code')).toBe('the-code')
    expect(tokens.access_token).toBe('at')
  })
})
