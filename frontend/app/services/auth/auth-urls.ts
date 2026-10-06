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

import { href } from 'react-router'

import { type AuthProvider } from './types'

/** Params carried through the internal auth flow (login ↔ register) */
interface InternalAuthParameters {
  email?: string
  invitation_id?: string
  registered?: boolean
  returnTo?: string
}

/** Build `/internal-oauth/login` URL with full auth params. */
export function internalLoginUrl(parameters?: InternalAuthParameters): string {
  return `${href('/internal-oauth/login')}${buildQuery({ ...parameters })}`
}

/** Build `/internal-oauth/register` URL with invitation context. */
export function internalRegisterUrl(
  parameters?: Pick<InternalAuthParameters, 'email' | 'invitation_id' | 'returnTo'>,
): string {
  return `${href('/internal-oauth/register')}${buildQuery({ ...parameters })}`
}

/** Build `/login` URL with optional returnTo or error params. */
export function loginUrl(parameters?: { error?: string; returnTo?: string }): string {
  return `${href('/login')}${buildQuery(parameters ?? {})}`
}

/** Build `/logout` URL. */
export function logoutUrl(): string {
  return href('/logout')
}

/**
 * Build the provider-specific login URL.
 * Routes internal → `/internal-oauth/login`, external → `/oauth/:provider/login`.
 *
 * For external OAuth, only `returnTo` is forwarded — `email` and `invitation_id`
 * are stripped because the external OAuth route only reads `returnTo`.
 * Invitation context travels via the returnTo path (e.g. `/join/ABC123`).
 */
export function providerLoginUrl(
  provider: AuthProvider,
  parameters?: Pick<InternalAuthParameters, 'email' | 'invitation_id' | 'returnTo'>,
): string {
  if (provider === 'internal') {
    return `${href('/internal-oauth/login')}${buildQuery({ ...parameters })}`
  }
  return `${href('/oauth/:provider/login', { provider })}${buildQuery({
    returnTo: parameters?.returnTo,
  })}`
}

/**
 * Turn the `callbackUrl` of a Lasius 2.x link into a `returnTo` path. NextAuth stored an absolute URL,
 * so only the path and the search remain. The receiving loader still sanitizes the value.
 */
export function returnToFromCallbackUrl(callbackUrl: null | string): string | undefined {
  if (!callbackUrl) return undefined
  try {
    const url = new URL(callbackUrl, 'http://localhost')
    return `${url.pathname}${url.search}`
  } catch {
    return undefined
  }
}

/**
 * Build a query string from params, omitting falsy values.
 * Returns `?key=value&...` or empty string when no params are set.
 */
function buildQuery(entries: Record<string, boolean | string | undefined>): string {
  const parameters = new URLSearchParams()
  for (const [key, value] of Object.entries(entries)) {
    if (!value) continue
    parameters.set(key, typeof value === 'boolean' ? 'true' : value)
  }
  const qs = parameters.toString()
  return qs ? `?${qs}` : ''
}
