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

import { getServerEnvironmentRequired } from '~/lib/environment.server'
import { logger } from '~/lib/logger'

import { type OAuthProvider, type TokenResponse } from '../types'
import { buildAuthorizationUrl, fetchProfile, postTokenRequest } from './oauth2-client.server'

interface GitHubEmail {
  email: string
  primary: boolean
  verified: boolean
}

export function createGitHubProvider(): OAuthProvider {
  const clientId = getServerEnvironmentRequired('GITHUB_OAUTH_CLIENT_ID')
  const clientSecret = getServerEnvironmentRequired('GITHUB_OAUTH_CLIENT_SECRET')

  return {
    async exchangeCode(code, redirectUri, codeVerifier): Promise<TokenResponse> {
      const data = await postTokenRequest<{
        access_token: string
        error?: string
        scope: string
        token_type: string
      }>('GitHub', 'https://github.com/login/oauth/access_token', {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        ...(codeVerifier && { code_verifier: codeVerifier }),
      })
      // GitHub can answer a refused exchange, for example `bad_verification_code`, with status 200.
      if (data.error) throw new Error(`GitHub token request failed: ${data.error}`)

      // GitHub tokens don't expire by default — set a long expiry
      return {
        access_token: data.access_token,
        expires_in: 60 * 60 * 24 * 365, // 1 year
        scope: data.scope,
        token_type: data.token_type,
      }
    },

    getAuthorizationUrl: (state, redirectUri, codeChallenge) =>
      buildAuthorizationUrl('https://github.com/login/oauth/authorize', {
        clientId,
        codeChallenge,
        redirectUri,
        responseType: false,
        scope: 'read:user user:email',
        state,
      }),

    async getUserProfile(accessToken: string): Promise<{ email: string; userId: string }> {
      const [user, emailsResponse] = await Promise.all([
        fetchProfile<{ id: number }>('GitHub', 'https://api.github.com/user', accessToken),
        fetch('https://api.github.com/user/emails', {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      ])

      const userId = user.id.toString()

      if (!emailsResponse.ok) {
        logger.warn('GitHub /user/emails request failed', { status: emailsResponse.status })
        return { email: '', userId }
      }

      const emails = (await emailsResponse.json()) as GitHubEmail[]
      return { email: selectVerifiedEmail(emails), userId }
    },

    provider: 'github',

    async refreshToken(): Promise<null | TokenResponse> {
      // GitHub tokens don't support refresh — they don't expire by default
      logger.debug('GitHub tokens do not support refresh')
      return null
    },

    // A GitHub session has no refresh token, so the app revokes the access token.
    async revokeToken({ accessToken }): Promise<void> {
      const response = await fetch(`https://api.github.com/applications/${clientId}/token`, {
        body: JSON.stringify({ access_token: accessToken }),
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`GitHub token revocation failed: ${response.status}`)
      }
    },
  }
}

// An unverified address can belong to someone else, so the app never signs a user in with one.
function selectVerifiedEmail(emails: GitHubEmail[]): string {
  const verified = emails.filter((githubEmail) => githubEmail.verified)
  return (verified.find((githubEmail) => githubEmail.primary) ?? verified[0])?.email ?? ''
}
