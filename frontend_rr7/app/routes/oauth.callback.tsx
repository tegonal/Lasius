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

import { href, redirect } from 'react-router'

import { logger } from '~/lib/logger'
import {
  oauthStateCookie,
  type OAuthStateCookieData,
} from '~/services/auth/oauth-state-cookie.server'
import { getProvider } from '~/services/auth/providers'
import { createUserSession } from '~/services/auth/session.server'

import { type Route } from './+types/oauth.callback'

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    logger.error('OAuth callback received error from provider', { error })
    throw redirect(`${href('/login')}?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    logger.warn('OAuth callback missing code or state')
    throw redirect(`${href('/login')}?error=no_code`)
  }

  // Read and validate state cookie
  const cookieHeader = request.headers.get('Cookie')
  const cookieData = (await oauthStateCookie.parse(
    cookieHeader,
  )) as null | OAuthStateCookieData

  if (!cookieData) {
    logger.warn('OAuth callback: state cookie missing or expired')
    throw redirect(`${href('/login')}?error=state_mismatch`)
  }

  if (cookieData.state !== state) {
    logger.warn('OAuth callback: state mismatch', {
      expected: cookieData.state,
      received: state,
    })
    throw redirect(`${href('/login')}?error=state_mismatch`)
  }

  const { codeVerifier, provider: providerName, returnTo } = cookieData

  try {
    const provider = getProvider(providerName)
    // Use Host header for correct origin behind reverse proxy
    const host =
      request.headers.get('x-forwarded-host') || request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const origin = host ? `${protocol}://${host}` : url.origin
    const redirectUri = `${origin}${href('/oauth/callback')}`

    // Exchange authorization code for tokens
    const tokens = await provider.exchangeCode(code, redirectUri, codeVerifier)

    // Get user profile
    const profile = await provider.getUserProfile(tokens.access_token)

    logger.debug('OAuth login successful', {
      email: profile.email,
      provider: providerName,
    })

    // Clear the state cookie by setting maxAge to 0
    const clearCookie = await oauthStateCookie.serialize(null, { maxAge: 0 })

    // Create session and redirect — the createUserSession redirect will include
    // the session cookie. We need to also include the clear cookie.
    const session = await createUserSession(
      {
        accessToken: tokens.access_token,
        email: profile.email,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        issuedAt: Date.now(),
        refreshToken: tokens.refresh_token ?? '',
        tokenIssuer: providerName,
        userId: profile.userId,
      },
      returnTo || '/',
    )

    // Append the clear-state-cookie header to the session redirect response
    session.headers.append('Set-Cookie', clearCookie)
    return session
  } catch (error_) {
    logger.error('OAuth callback: token exchange or profile fetch failed', {
      error: error_,
      provider: providerName,
    })
    throw redirect(`${href('/login')}?error=token_exchange_failed`)
  }
}

/**
 * This route is loader-only (processes callback and redirects).
 * No component is rendered.
 */
export default function OAuthCallback() {
  return null
}
