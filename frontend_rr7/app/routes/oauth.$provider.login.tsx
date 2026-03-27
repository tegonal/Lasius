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

import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from '~/lib/crypto.server'
import { logger } from '~/lib/logger'
import { sanitizeReturnTo } from '~/services/auth/auth-helpers.server'
import { loginUrl } from '~/services/auth/auth-urls'
import { oauthStateCookie } from '~/services/auth/oauth-state-cookie.server'
import { getProvider, isProviderEnabled } from '~/services/auth/providers'
import { type AuthProvider } from '~/services/auth/types'

import { type Route } from './+types/oauth.$provider.login'

const VALID_PROVIDERS: Set<AuthProvider> = new Set([
  'github',
  'gitlab',
  'keycloak',
])

export async function loader({ params, request }: Route.LoaderArgs) {
  const providerName = params.provider as AuthProvider

  if (!VALID_PROVIDERS.has(providerName) || !isProviderEnabled(providerName)) {
    logger.warn('Invalid or disabled OAuth provider requested', {
      provider: providerName,
    })
    throw redirect(loginUrl({ error: 'invalid_provider' }))
  }

  const url = new URL(request.url)
  const returnTo = sanitizeReturnTo(url.searchParams.get('returnTo') ?? '/')

  const state = generateState()
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  // Build the callback URL — use Host header for correct origin behind reverse proxy
  const host =
    request.headers.get('x-forwarded-host') || request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const origin = host ? `${protocol}://${host}` : url.origin
  const redirectUri = `${origin}${href('/oauth/callback')}`

  // Store state, provider, code verifier, and returnTo in a cookie
  const cookieData = {
    codeVerifier,
    provider: providerName,
    returnTo,
    state,
  }

  const provider = getProvider(providerName)
  const authorizationUrl = provider.getAuthorizationUrl(
    state,
    redirectUri,
    codeChallenge,
  )

  logger.debug('Redirecting to OAuth provider', { provider: providerName })

  return redirect(authorizationUrl, {
    headers: {
      'Set-Cookie': await oauthStateCookie.serialize(cookieData),
    },
  })
}

/**
 * This route is loader-only (redirects to the OAuth provider).
 * No component is rendered.
 */
export default function OAuthProviderLogin() {
  return null
}
