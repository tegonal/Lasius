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

import { getServerEnvRequired } from '~/lib/env.server'
import { logger } from '~/lib/logger'

import { type OAuthProvider, type TokenResponse } from '../types'

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
  const clientId = getServerEnvRequired('LASIUS_OAUTH_CLIENT_ID')
  const clientSecret = getServerEnvRequired('LASIUS_OAUTH_CLIENT_SECRET')
  const apiUrl = getServerEnvRequired('LASIUS_API_URL')

  const tokenUrl = `${apiUrl}/oauth2/access_token`
  const loginUrl = `${apiUrl}/oauth2/login`
  const profileUrl = `${apiUrl}/oauth2/profile`
  const logoutUrl = `${apiUrl}/oauth2/logout`

  /** Generate a random PKCE code verifier */
  function generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return base64UrlEncode(array)
  }

  /** Create a SHA-256 code challenge from a code verifier */
  async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return base64UrlEncode(new Uint8Array(digest))
  }

  function base64UrlEncode(bytes: Uint8Array): string {
    let binary = ''
    for (const byte of bytes) {
      binary += String.fromCodePoint(byte)
    }
    return btoa(binary)
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/={1,2}$/, '')
  }

  return {
    async exchangeCode(
      code: string,
      redirectUri: string,
      codeVerifier?: string,
    ): Promise<TokenResponse> {
      const body: Record<string, string> = {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }

      if (codeVerifier) {
        body.code_verifier = codeVerifier
      }

      const response = await fetch(tokenUrl, {
        body: new URLSearchParams(body),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.text()
        logger.error('Internal token exchange failed', {
          error,
          status: response.status,
        })
        throw new Error(`Internal token exchange failed: ${response.status}`)
      }

      return (await response.json()) as TokenResponse
    },

    getAuthorizationUrl(_state: string, _redirectUri: string): string {
      // Internal provider does not use browser-redirect authorization.
      // Use loginWithCredentials() instead.
      throw new Error(
        'Internal provider does not support getAuthorizationUrl — use loginWithCredentials()',
      )
    },

    async getUserProfile(
      accessToken: string,
    ): Promise<{ email: string; userId: string }> {
      const response = await fetch(profileUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        throw new Error(`Internal profile fetch failed: ${response.status}`)
      }

      const profile = (await response.json()) as { email: string; sub: string }
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
      const tokens = await this.exchangeCode(code, '/', codeVerifier)

      // Step 4: Fetch user profile
      const profile = await this.getUserProfile(tokens.access_token)

      return { profile, tokens }
    },

    provider: 'internal',

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
          logger.warn('Internal token refresh failed', {
            status: response.status,
          })
          return null
        }

        return (await response.json()) as TokenResponse
      } catch (error) {
        logger.error('Internal token refresh error', { error })
        return null
      }
    },

    async revokeToken(token: string): Promise<void> {
      try {
        await fetch(logoutUrl, {
          headers: { Authorization: `Bearer ${token}` },
          method: 'POST',
        })
      } catch (error) {
        logger.warn('Internal token revocation failed', { error })
      }
    },
  }
}
