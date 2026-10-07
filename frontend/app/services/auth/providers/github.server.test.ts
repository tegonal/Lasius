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

const fetchMock = vi.fn()

const respond = (emails: Response) => {
  fetchMock.mockImplementation((url: string) =>
    Promise.resolve(url.endsWith('/user/emails') ? emails : Response.json({ id: 4711 })),
  )
}

describe('GitHub profile', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_OAUTH_CLIENT_ID', 'gh-client')
    vi.stubEnv('GITHUB_OAUTH_CLIENT_SECRET', 'gh-secret')
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('chooses the verified primary email and returns the id as a string', async () => {
    respond(
      Response.json([
        { email: 'other@example.com', primary: false, verified: true },
        { email: 'jane@example.com', primary: true, verified: true },
      ]),
    )

    const profile = await createGitHubProvider().getUserProfile('the-token')

    expect(profile).toEqual({ email: 'jane@example.com', userId: '4711' })
    const [, init] = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/user/emails')) as [
      string,
      RequestInit,
    ]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer the-token')
  })

  it('skips an unverified primary email for a verified secondary email', async () => {
    respond(
      Response.json([
        { email: 'unverified@example.com', primary: true, verified: false },
        { email: 'verified@example.com', primary: false, verified: true },
      ]),
    )

    const profile = await createGitHubProvider().getUserProfile('the-token')

    expect(profile.email).toBe('verified@example.com')
  })

  it('returns an empty email when no email is verified', async () => {
    respond(Response.json([{ email: 'unverified@example.com', primary: true, verified: false }]))

    const profile = await createGitHubProvider().getUserProfile('the-token')

    expect(profile).toEqual({ email: '', userId: '4711' })
  })

  it('returns an empty email when the emails request answers 403', async () => {
    respond(new Response('Forbidden', { status: 403 }))

    const profile = await createGitHubProvider().getUserProfile('the-token')

    expect(profile).toEqual({ email: '', userId: '4711' })
  })
})
