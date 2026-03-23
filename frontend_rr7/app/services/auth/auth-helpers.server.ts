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

import { getCsrfToken } from '~/services/api/lasius/general/general'

import { getSessionTokens } from './session.server'
import { type LasiusSessionData } from './types'

export interface AuthResult {
  /** Set-Cookie header to propagate if the token was refreshed */
  headers?: HeadersInit
  session: LasiusSessionData
}

/** Build authorization headers for backend API calls */
export function authHeaders(
  session: LasiusSessionData,
): Record<string, string> {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Token-Issuer': session.tokenIssuer,
  }
}

/**
 * Build headers for backend write requests (POST/PUT/DELETE) that require CSRF.
 *
 * Play Framework CSRF: GET /csrf-token returns a token value and sets a
 * PLAY_SESSION_CSRF cookie. Browser requests forward the cookie automatically,
 * but server-side calls (loaders/actions) have no cookie jar — we must fetch
 * the token and forward both the header and cookie explicitly.
 */
export async function authHeadersWithCsrf(
  session: LasiusSessionData,
): Promise<Record<string, string>> {
  const headers = authHeaders(session)
  const csrf = await getCsrfToken({ headers })

  const setCookie = csrf.headers.get('set-cookie') ?? ''
  const match = setCookie.match(/PLAY_SESSION_CSRF=([^;]+)/)
  const csrfCookie = match ? `PLAY_SESSION_CSRF=${match[1]}` : ''

  return {
    ...headers,
    Cookie: csrfCookie,
    'Csrf-Token': csrf.data.value,
  }
}

/**
 * Get the current user session if it exists, without requiring authentication.
 * Use in loaders that show different content for authenticated vs anonymous users.
 */
export async function getOptionalUser(
  request: Request,
): Promise<AuthResult | null> {
  const result = await getSessionTokens(request)
  if (!result) return null
  return { headers: result.headers, session: result.tokens }
}

/**
 * Merge auth Set-Cookie headers into a Headers object for loader/action responses.
 * Call this when building the response headers for any loader/action that uses requireUser.
 */
export function mergeAuthHeaders(
  authResult: AuthResult,
  responseHeaders?: HeadersInit,
): Headers {
  const headers = new Headers(responseHeaders)
  if (authResult.headers) {
    const setCookie =
      authResult.headers instanceof Headers
        ? authResult.headers.get('Set-Cookie')
        : (authResult.headers as Record<string, string>)['Set-Cookie']
    if (setCookie) {
      headers.append('Set-Cookie', setCookie)
    }
  }
  return headers
}

/**
 * Require an authenticated user session. Redirects to /login if no valid session exists.
 * Use in loaders/actions that need authentication.
 *
 * Returns both the session and any Set-Cookie headers needed to persist a refreshed token.
 * Always propagate `result.headers` via `mergeAuthHeaders()` in your loader response.
 */
export async function requireUser(request: Request): Promise<AuthResult> {
  const result = await getSessionTokens(request)

  if (!result) {
    const url = new URL(request.url)
    const pathname = url.pathname

    // Resource routes (fetcher-only endpoints) should not set returnTo —
    // redirecting to /api/* after login makes no sense for the user.
    const returnTo = pathname.startsWith('/api/')
      ? '/'
      : encodeURIComponent(pathname)

    throw redirect(`${href('/login')}?returnTo=${returnTo}`)
  }

  return { headers: result.headers, session: result.tokens }
}

/**
 * Sanitize a returnTo URL to prevent open redirects.
 * Only allows relative paths — rejects absolute URLs, protocol-relative URLs, and data URIs.
 */
export function sanitizeReturnTo(value: string, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }
  // Reject backslash paths — some browsers normalize `\` to `/`,
  // turning `/\evil.com` into `//evil.com` (protocol-relative URL).
  if (value.includes('\\')) {
    return fallback
  }
  return value
}
