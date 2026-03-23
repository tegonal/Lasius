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

import { createCookieSessionStorage, href, redirect } from 'react-router'

import { logger } from '~/lib/logger'

import { getProvider } from './providers'
import { type LasiusSessionData } from './types'

export type { LasiusSessionData }

/**
 * In-flight refresh dedup: when multiple parallel loaders call getSessionTokens()
 * with the same refresh token, only the first one actually refreshes. Others await
 * the same promise. Keyed by refresh token to handle concurrent requests correctly.
 */
const inflightRefreshes = new Map<
  string,
  Promise<null | {
    access_token: string
    expires_in: number
    refresh_token?: string
  }>
>()

function getSessionStorage() {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('Missing required env var: AUTH_SECRET')
  }

  return createCookieSessionStorage<{ user: LasiusSessionData }>({
    cookie: {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      name: '_lasius_session',
      path: '/',
      sameSite: 'lax',
      secrets: [secret],
      secure: process.env.NODE_ENV === 'production',
    },
  })
}

let _sessionStorage: ReturnType<typeof getSessionStorage> | undefined

/** Create a new user session and redirect */
export async function createUserSession(
  data: LasiusSessionData,
  redirectTo: string,
): Promise<Response> {
  const session = await getSession(null)
  session.set('user', data)

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  })
}

/** Destroy the user session and redirect to login */
export async function destroyUserSession(
  request: Request,
  redirectTo = href('/login'),
): Promise<Response> {
  const session = await getUserSession(request)

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  })
}

/**
 * Read session tokens, auto-refreshing if expired (60s buffer).
 * Returns tokens + optional Set-Cookie header if refreshed, or null if no valid session.
 */
export async function getSessionTokens(
  request: Request,
): Promise<null | { headers?: HeadersInit; tokens: LasiusSessionData }> {
  const session = await getUserSession(request)
  const user = session.get('user')

  if (!user) {
    return null
  }

  // Sliding-window refresh: refresh once past the midpoint of the token's lifetime.
  // This ensures any page load or navigation extends the session proactively,
  // rather than waiting until the last 60s before expiry.
  // For pre-migration sessions without issuedAt, assume token was issued
  // 5 minutes ago to avoid triggering an immediate refresh storm.
  const fallbackIssuedAt = user.expiresAt - 300_000
  const issuedAt = user.issuedAt ?? fallbackIssuedAt
  const tokenLifetime = user.expiresAt - issuedAt
  const halfLife = tokenLifetime > 0 ? tokenLifetime / 2 : 60_000
  const needsRefresh = Date.now() > issuedAt + halfLife

  if (needsRefresh) {
    logger.debug('Access token past half-life, refreshing')

    const refreshKey = user.refreshToken
    const refreshed = await deduplicatedRefresh(refreshKey, user)

    if (refreshed) {
      logger.debug('Token refresh successful')

      const now = Date.now()
      const updatedUser: LasiusSessionData = {
        ...user,
        accessToken: refreshed.access_token,
        expiresAt: now + refreshed.expires_in * 1000,
        issuedAt: now,
        refreshToken: refreshed.refresh_token ?? user.refreshToken,
      }

      session.set('user', updatedUser)
      const setCookie = await commitSession(session)

      return {
        headers: { 'Set-Cookie': setCookie },
        tokens: updatedUser,
      }
    }

    // Refresh failed — the refresh token is invalid (e.g. backend restarted).
    // Force logout so the user gets a fresh session with valid tokens.
    logger.warn('Refresh token invalid, forcing logout')
    throw await destroyUserSession(request)
  }

  return { tokens: user }
}

/** Read user session from the request cookie */
export async function getUserSession(request: Request) {
  return getSession(request.headers.get('Cookie'))
}

/** Update session tokens (e.g., after a refresh) and return the Set-Cookie header */
export async function setSessionTokens(
  request: Request,
  tokens: LasiusSessionData,
): Promise<string> {
  const session = await getUserSession(request)
  session.set('user', tokens)
  return await commitSession(session)
}

function commitSession(
  ...args: Parameters<ReturnType<typeof getSessionStorage>['commitSession']>
) {
  return sessionStorage().commitSession(...args)
}

/** Backoff delays for token refresh retries: 500ms → 1s → 2s */
const REFRESH_BACKOFF_MS = [500, 1000, 2000]

/**
 * Deduplicate concurrent refresh calls: if multiple parallel loaders trigger a refresh
 * with the same refresh token, only one network request is made. Retries up to 3 times
 * with exponential backoff (500ms → 1s → 2s) before giving up.
 */
async function deduplicatedRefresh(
  refreshKey: string,
  user: LasiusSessionData,
): Promise<null | {
  access_token: string
  expires_in: number
  refresh_token?: string
}> {
  const inflight = inflightRefreshes.get(refreshKey)
  if (inflight) {
    logger.debug('Joining in-flight refresh for dedup')
    return inflight
  }

  const promise = (async () => {
    const provider = getProvider(user.tokenIssuer)

    for (let i = 0; i <= REFRESH_BACKOFF_MS.length; i++) {
      try {
        return await provider.refreshToken(user.refreshToken)
      } catch (error) {
        if (i < REFRESH_BACKOFF_MS.length) {
          const delay = REFRESH_BACKOFF_MS[i]
          logger.warn(
            `Token refresh attempt ${i + 1} failed, retrying in ${delay}ms`,
            error,
          )
          await new Promise((r) => setTimeout(r, delay))
        } else {
          logger.warn(
            `Token refresh failed after ${REFRESH_BACKOFF_MS.length + 1} attempts`,
            error,
          )
          return null
        }
      }
    }

    return null
  })()

  inflightRefreshes.set(refreshKey, promise)

  try {
    return await promise
  } finally {
    inflightRefreshes.delete(refreshKey)
  }
}

function destroySession(
  ...args: Parameters<ReturnType<typeof getSessionStorage>['destroySession']>
) {
  return sessionStorage().destroySession(...args)
}

function getSession(cookieHeader: null | string) {
  return sessionStorage().getSession(cookieHeader)
}

function sessionStorage() {
  if (!_sessionStorage) {
    _sessionStorage = getSessionStorage()
  }
  return _sessionStorage
}
