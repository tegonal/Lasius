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
interface InternalAuthParams {
  email?: string
  invitation_id?: string
  registered?: boolean
  returnTo?: string
}

/** Build `/internal-oauth/login` URL with full auth params. */
export function internalLoginUrl(params?: InternalAuthParams): string {
  return `${href('/internal-oauth/login')}${buildQuery({ ...params })}`
}

/** Build `/internal-oauth/register` URL with invitation context. */
export function internalRegisterUrl(
  params?: Pick<InternalAuthParams, 'invitation_id' | 'returnTo'>,
): string {
  return `${href('/internal-oauth/register')}${buildQuery({ ...params })}`
}

/** Build `/login` URL with optional returnTo or error params. */
export function loginUrl(params?: {
  error?: string
  returnTo?: string
}): string {
  return `${href('/login')}${buildQuery(params ?? {})}`
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
  params?: Pick<InternalAuthParams, 'email' | 'invitation_id' | 'returnTo'>,
): string {
  if (provider === 'internal') {
    return `${href('/internal-oauth/login')}${buildQuery({ ...params })}`
  }
  return `${href('/oauth/:provider/login', { provider })}${buildQuery({
    returnTo: params?.returnTo,
  })}`
}

/**
 * Build a query string from params, omitting falsy values.
 * Returns `?key=value&...` or empty string when no params are set.
 */
function buildQuery(
  entries: Record<string, boolean | string | undefined>,
): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === '' || value === false) continue
    params.set(key, typeof value === 'boolean' ? 'true' : value)
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}
