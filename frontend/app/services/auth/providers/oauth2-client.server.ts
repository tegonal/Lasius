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

import { logger } from '~/lib/logger'

import { type AuthProvider, type OAuthProvider, type TokenResponse } from '../types'

export interface ClientCredentials {
  clientId: string
  clientSecret: string
}

interface AuthorizationUrlParameters {
  clientId: string
  codeChallenge?: string
  redirectUri: string
  /** GitHub takes no `response_type`. */
  responseType?: boolean
  scope: string
  state: string
}

interface OAuth2ProviderConfig {
  authorizationUrl: string
  credentials: ClientCredentials
  getUserProfile: OAuthProvider['getUserProfile']
  /** Provider name in log and error messages, for example `Keycloak`. */
  label: string
  provider: AuthProvider
  revokeUrl: string
  scope: string
  tokenUrl: string
}

/** Builds the authorization URL. A code challenge adds PKCE with S256 (RFC 7636). */
export function buildAuthorizationUrl(
  endpoint: string,
  {
    clientId,
    codeChallenge,
    redirectUri,
    responseType = true,
    scope,
    state,
  }: AuthorizationUrlParameters,
): string {
  const url = new URL(endpoint)
  url.searchParams.set('client_id', clientId)
  if (responseType) url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', scope)
  url.searchParams.set('state', state)
  url.searchParams.set('redirect_uri', redirectUri)
  if (codeChallenge) {
    url.searchParams.set('code_challenge', codeChallenge)
    url.searchParams.set('code_challenge_method', 'S256')
  }
  return url.href
}

/** A provider with the authorization code flow, PKCE, refresh and RFC 7009 revocation. */
export function createOAuth2Provider(config: OAuth2ProviderConfig): OAuthProvider {
  const { authorizationUrl, credentials, label, revokeUrl, scope, tokenUrl } = config
  return {
    exchangeCode: (code, redirectUri, codeVerifier) =>
      exchangeAuthorizationCode(label, tokenUrl, credentials, { code, codeVerifier, redirectUri }),
    getAuthorizationUrl: (state, redirectUri, codeChallenge) =>
      buildAuthorizationUrl(authorizationUrl, {
        clientId: credentials.clientId,
        codeChallenge,
        redirectUri,
        scope,
        state,
      }),
    getUserProfile: config.getUserProfile,
    provider: config.provider,
    refreshToken: (refreshToken) => refreshAccessToken(label, tokenUrl, credentials, refreshToken),
    revokeToken: ({ refreshToken }) => revokeToken(label, revokeUrl, credentials, refreshToken),
  }
}

/** Exchanges an authorization code. The verifier completes PKCE. */
export function exchangeAuthorizationCode(
  label: string,
  tokenUrl: string,
  { clientId, clientSecret }: ClientCredentials,
  { code, codeVerifier, redirectUri }: { code: string; codeVerifier?: string; redirectUri: string },
): Promise<TokenResponse> {
  return postTokenRequest<TokenResponse>(label, tokenUrl, {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    ...(codeVerifier && { code_verifier: codeVerifier }),
  })
}

/** Fetches a profile document with the access token. Throws on an error status. */
export async function fetchProfile<T>(label: string, url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    throw new Error(`${label} profile request failed: ${response.status}`)
  }
  return (await response.json()) as T
}

/**
 * Posts a form to a token endpoint and returns the JSON answer. On an error status it throws with
 * the status and the start of the body. The caller logs it: a refused refresh is routine.
 */
export async function postTokenRequest<T>(
  label: string,
  tokenUrl: string,
  parameters: Record<string, string>,
): Promise<T> {
  const response = await fetch(tokenUrl, {
    body: new URLSearchParams(parameters),
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`${label} token request failed: ${response.status} ${body.slice(0, 300)}`)
  }
  return (await response.json()) as T
}

/** Returns new tokens, or null when the provider refuses the refresh token. */
export async function refreshAccessToken(
  label: string,
  tokenUrl: string,
  { clientId, clientSecret }: ClientCredentials,
  refreshToken: string,
): Promise<null | TokenResponse> {
  try {
    return await postTokenRequest<TokenResponse>(label, tokenUrl, {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })
  } catch (error) {
    logger.warn(`${label} token refresh failed`, { error })
    return null
  }
}

/** Revokes a token at an RFC 7009 endpoint. Throws on an error status. */
async function revokeToken(
  label: string,
  revokeUrl: string,
  { clientId, clientSecret }: ClientCredentials,
  token: string,
): Promise<void> {
  const response = await fetch(revokeUrl, {
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, token }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error(`${label} token revocation failed: ${response.status}`)
  }
}
