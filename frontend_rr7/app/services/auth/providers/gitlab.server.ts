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

import { getServerEnv, getServerEnvRequired } from '~/lib/env.server'
import { logger } from '~/lib/logger'

import { type OAuthProvider, type TokenResponse } from '../types'

export function createGitLabProvider(): OAuthProvider {
  const clientId = getServerEnvRequired('GITLAB_OAUTH_CLIENT_ID')
  const clientSecret = getServerEnvRequired('GITLAB_OAUTH_CLIENT_SECRET')
  const baseUrl = getServerEnv('GITLAB_OAUTH_URL', 'https://gitlab.com')!

  const authorizationUrl = `${baseUrl}/oauth/authorize`
  const tokenUrl = `${baseUrl}/oauth/token`
  const userinfoUrl = `${baseUrl}/api/v4/user`
  const revokeUrl = `${baseUrl}/oauth/revoke`

  return {
    async exchangeCode(
      code: string,
      redirectUri: string,
    ): Promise<TokenResponse> {
      const response = await fetch(tokenUrl, {
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.text()
        logger.error('GitLab token exchange failed', {
          error,
          status: response.status,
        })
        throw new Error(`GitLab token exchange failed: ${response.status}`)
      }

      return (await response.json()) as TokenResponse
    },

    getAuthorizationUrl(state: string, redirectUri: string): string {
      const url = new URL(authorizationUrl)
      url.searchParams.set('client_id', clientId)
      url.searchParams.set('response_type', 'code')
      url.searchParams.set('scope', 'openid email')
      url.searchParams.set('state', state)
      url.searchParams.set('redirect_uri', redirectUri)
      return url.toString()
    },

    async getUserProfile(
      accessToken: string,
    ): Promise<{ email: string; userId: string }> {
      const response = await fetch(userinfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        throw new Error(`GitLab userinfo failed: ${response.status}`)
      }

      const profile = (await response.json()) as {
        email: string
        id: number
      }
      return { email: profile.email, userId: profile.id.toString() }
    },

    provider: 'gitlab',

    async refreshToken(
      refreshTokenValue: string,
    ): Promise<null | TokenResponse> {
      try {
        const response = await fetch(tokenUrl, {
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshTokenValue,
          }),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          method: 'POST',
        })

        if (!response.ok) {
          logger.warn('GitLab token refresh failed', {
            status: response.status,
          })
          return null
        }

        return (await response.json()) as TokenResponse
      } catch (error) {
        logger.error('GitLab token refresh error', { error })
        return null
      }
    },

    async revokeToken(token: string): Promise<void> {
      try {
        await fetch(revokeUrl, {
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            token,
          }),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          method: 'POST',
        })
      } catch (error) {
        logger.warn('GitLab token revocation failed', { error })
      }
    },
  }
}
