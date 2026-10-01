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

import { generateCodeChallenge, generateCodeVerifier } from '~/lib/crypto.server'
import { getServerEnvironmentRequired } from '~/lib/environment.server'
import { logger } from '~/lib/logger'

import { type OAuthProvider, type TokenResponse } from '../types'
import { exchangeAuthorizationCode, fetchProfile, refreshAccessToken } from './oauth2-client.server'

/**
 * Internal Lasius OAuth provider.
 *
 * Unlike external providers, the internal provider uses the Lasius backend's
 * own OAuth2 endpoints with PKCE. The login form submits credentials directly
 * via `loginWithCredentials` — there is no browser redirect to an authorization URL.
 */
export interface InternalOAuthProvider extends OAuthProvider {
  /** Authenticate with email/password using PKCE flow against the Lasius backend */
  loginWithCredentials(
    email: string,
    password: string,
  ): Promise<{
    profile: { email: string; userId: string }
    tokens: TokenResponse
  }>
}

export function createInternalProvider(): InternalOAuthProvider {
  const clientId = getServerEnvironmentRequired('LASIUS_OAUTH_CLIENT_ID')
  const clientSecret = getServerEnvironmentRequired('LASIUS_OAUTH_CLIENT_SECRET')
  const apiUrl = getServerEnvironmentRequired('LASIUS_API_URL')

  const credentials = { clientId, clientSecret }
  const tokenUrl = `${apiUrl}/oauth2/access_token`
  const loginUrl = `${apiUrl}/oauth2/login`
  const profileUrl = `${apiUrl}/oauth2/profile`
  const logoutUrl = `${apiUrl}/oauth2/logout`

  const provider: InternalOAuthProvider = {
    exchangeCode: (code, redirectUri, codeVerifier) =>
      exchangeAuthorizationCode('Internal', tokenUrl, credentials, {
        code,
        codeVerifier,
        redirectUri,
      }),

    getAuthorizationUrl(_state: string, _redirectUri: string): string {
      // Internal provider does not use browser-redirect authorization.
      // Use loginWithCredentials() instead.
      throw new Error(
        'Internal provider does not support getAuthorizationUrl — use loginWithCredentials()',
      )
    },

    async getUserProfile(accessToken: string): Promise<{ email: string; userId: string }> {
      const profile = await fetchProfile<{ email: string; sub: string }>(
        'Internal',
        profileUrl,
        accessToken,
      )
      return { email: profile.email, userId: profile.sub }
    },

    async loginWithCredentials(
      email: string,
      password: string,
    ): Promise<{
      profile: { email: string; userId: string }
      tokens: TokenResponse
    }> {
      // Step 1: Generate PKCE pair
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      // Step 2: POST credentials to login endpoint to get an authorization code
      const loginResponse = await fetch(loginUrl, {
        body: JSON.stringify({
          clientId,
          codeChallenge,
          codeChallengeMethod: 'S256',
          email,
          password,
          redirectUri: '/',
          responseType: 'code',
          scope: 'openid',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        redirect: 'manual',
      })

      if (loginResponse.status === 401) {
        throw new Error('Invalid credentials')
      }

      // The backend redirects with ?code=... — extract the code from the Location header
      // or from the response URL
      let code: null | string = null

      const location = loginResponse.headers.get('Location')
      if (location) {
        const locationUrl = new URL(location, apiUrl)
        code = locationUrl.searchParams.get('code')
      }

      if (!code) {
        // Fallback: try parsing response body
        const body = (await loginResponse.json()) as { code?: string }
        code = body.code ?? null
      }

      if (!code) {
        logger.error('Internal login: no authorization code in response', {
          status: loginResponse.status,
        })
        throw new Error('Internal login failed: no authorization code received')
      }

      // Step 3: Exchange code for tokens using PKCE verifier
      const tokens = await provider.exchangeCode(code, '/', codeVerifier)

      // Step 4: Fetch user profile
      const profile = await provider.getUserProfile(tokens.access_token)

      return { profile, tokens }
    },

    provider: 'internal',

    refreshToken: (refreshTokenValue) =>
      refreshAccessToken('Internal', tokenUrl, credentials, refreshTokenValue),

    // The backend logout checks the Bearer token as an access token and deletes it.
    async revokeToken({ accessToken }): Promise<void> {
      const response = await fetch(logoutUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error(`Internal logout failed: ${response.status}`)
      }
    },
  }

  return provider
}
