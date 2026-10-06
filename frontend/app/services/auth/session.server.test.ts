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

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { createUserSession, forgetRefresh, getSessionTokens } from './session.server'

const { refreshToken } = vi.hoisted(() => ({ refreshToken: vi.fn() }))

vi.mock('./providers', () => ({ getProvider: () => ({ refreshToken }) }))

/** A session cookie whose access token is past half of its lifetime. */
async function staleSessionCookie(refreshTokenValue: string): Promise<string> {
  const now = Date.now()
  const response = await createUserSession(
    {
      accessToken: 'old-access',
      email: 'user@example.com',
      expiresAt: now + 1000,
      issuedAt: now - 600_000,
      refreshToken: refreshTokenValue,
      tokenIssuer: 'keycloak',
      userId: 'user-1',
    },
    '/',
  )
  return (response.headers.get('Set-Cookie') ?? '').split(';', 1)[0] ?? ''
}

const requestWith = (cookie: string) =>
  new Request('https://lasius.test/user/home', { headers: { Cookie: cookie } })

describe('createUserSession', () => {
  beforeAll(() => {
    vi.stubEnv('AUTH_SECRET', 'test-secret')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  const session = {
    accessToken: 'access',
    email: 'user@example.com',
    expiresAt: Date.now() + 3_600_000,
    issuedAt: Date.now(),
    refreshToken: 'refresh',
    tokenIssuer: 'keycloak' as const,
    userId: 'user-1',
  }

  // Callers pass the unsigned state cookie and a posted form field, so the sink must sanitize.
  it('sanitizes the redirect target', async () => {
    const response = await createUserSession(session, '/\t/example.com')
    expect(response.headers.get('Location')).toBe('/')
  })

  it('keeps a same-origin path with its query', async () => {
    const response = await createUserSession(session, '/user/lists?from=2026-10-01')
    expect(response.headers.get('Location')).toBe('/user/lists?from=2026-10-01')
  })
})

describe('getSessionTokens refresh', () => {
  beforeAll(() => {
    vi.stubEnv('AUTH_SECRET', 'test-secret')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  beforeEach(() => {
    // The provider rotates the refresh token: a second use of the same token fails.
    const usedTokens = new Set<string>()
    refreshToken.mockReset()
    refreshToken.mockImplementation(async (token: string) => {
      if (usedTokens.has(token)) throw new Error('invalid_grant: token is revoked')
      usedTokens.add(token)
      return {
        access_token: `new-access-for-${token}`,
        expires_in: 300,
        refresh_token: `new-refresh-for-${token}`,
        token_type: 'Bearer',
      }
    })
  })

  it('reuses a completed refresh for a later request with the old cookie', async () => {
    const cookie = await staleSessionCookie('rotating-1')

    const first = await getSessionTokens(requestWith(cookie))
    const second = await getSessionTokens(requestWith(cookie))

    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(second?.tokens.accessToken).toBe('new-access-for-rotating-1')
    expect(second?.tokens.refreshToken).toBe('new-refresh-for-rotating-1')
    expect(second?.tokens.expiresAt).toBe(first?.tokens.expiresAt)
    expect(new Headers(second?.headers).get('Set-Cookie')).toContain('_lasius_session=')
  })

  it('refreshes each refresh token on its own', async () => {
    await getSessionTokens(requestWith(await staleSessionCookie('rotating-2')))
    await getSessionTokens(requestWith(await staleSessionCookie('rotating-3')))

    expect(refreshToken).toHaveBeenCalledTimes(2)
  })
})

describe('getSessionTokens reuse window', () => {
  const tokens = {
    access_token: 'access',
    expires_in: 300,
    refresh_token: 'refresh-next',
    token_type: 'Bearer',
  }

  beforeAll(() => {
    vi.stubEnv('AUTH_SECRET', 'test-secret')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  beforeEach(() => {
    // This provider accepts a reused refresh token, so each test counts the provider calls.
    refreshToken.mockReset()
    refreshToken.mockResolvedValue(tokens)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('refreshes again once the window of 60 seconds is over', async () => {
    const cookie = await staleSessionCookie('window-1')
    await getSessionTokens(requestWith(cookie))

    const later = Date.now() + 61_000
    vi.spyOn(Date, 'now').mockReturnValue(later)
    await getSessionTokens(requestWith(cookie))

    expect(refreshToken).toHaveBeenCalledTimes(2)
  })

  it('gives no reused tokens to an old cookie after logout', async () => {
    const cookie = await staleSessionCookie('logout-1')
    const session = await getSessionTokens(requestWith(cookie))

    forgetRefresh(session?.tokens.refreshToken ?? '')
    await getSessionTokens(requestWith(cookie))

    expect(refreshToken).toHaveBeenCalledTimes(2)
  })
})
