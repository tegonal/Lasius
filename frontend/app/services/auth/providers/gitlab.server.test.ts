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

import { createGitLabProvider } from './gitlab.server'

const fetchMock = vi.fn()

describe('GitLab profile', () => {
  beforeEach(() => {
    vi.stubEnv('GITLAB_OAUTH_CLIENT_ID', 'gl-client')
    vi.stubEnv('GITLAB_OAUTH_CLIENT_SECRET', 'gl-secret')
    vi.stubEnv('GITLAB_OAUTH_URL', 'https://scm.example.com')
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(Response.json({ email: 'jane@example.com', sub: '42' }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  // The scopes `openid email` give no access to /api/v4/user, which answers 403.
  it('reads the OIDC userinfo endpoint, which the openid scope covers', async () => {
    const profile = await createGitLabProvider().getUserProfile('the-token')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://scm.example.com/oauth/userinfo')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer the-token')
    expect(profile).toEqual({ email: 'jane@example.com', userId: '42' })
  })

  it('accepts an email that the provider marks as verified', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ email: 'jane@example.com', email_verified: true, sub: '42' }),
    )
    const profile = await createGitLabProvider().getUserProfile('the-token')
    expect(profile.email).toBe('jane@example.com')
  })

  it('rejects email_verified sent as the string false', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ email: 'victim@example.com', email_verified: 'false', sub: '42' }),
    )
    await expect(createGitLabProvider().getUserProfile('the-token')).rejects.toThrow(
      'GitLab email address is not verified',
    )
  })

  it('rejects an email that the provider marks as unverified', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ email: 'victim@example.com', email_verified: false, sub: '42' }),
    )
    await expect(createGitLabProvider().getUserProfile('the-token')).rejects.toThrow(
      'GitLab email address is not verified',
    )
  })
})
