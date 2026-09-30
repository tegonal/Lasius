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

import { AUTH_REFRESH_BACKOFF_MS } from '~/config/constants'
import { logger } from '~/lib/logger'

import { getAuthSecret } from './auth-secret.server'
import { getProvider } from './providers'
import { type LasiusSessionData } from './types'

interface RefreshResult {
  access_token: string
  expires_in: number
  refresh_token?: string
  /** Date.now() when the provider answered. The new expiry counts from this moment. */
  refreshedAt: number
}

/**
 * In-flight refresh dedup: when multiple parallel loaders call getSessionTokens()
 * with the same refresh token, only the first one actually refreshes. Others await
 * the same promise. Keyed by refresh token to handle concurrent requests correctly.
 */
const inflightRefreshes = new Map<string, Promise<null | RefreshResult>>()

/**
 * A completed refresh, keyed by the old refresh token. A response can miss the new cookie, for
 * example a redirect of a sibling loader, and the browser then sends the old cookie again. The
 * provider revoked the old refresh token, so a second refresh would log the user out.
 */
const recentRefreshes = new Map<string, { expiresAt: number; result: RefreshResult }>()
const REFRESH_REUSE_WINDOW_MS = 60_000
const RECENT_REFRESHES_LIMIT = 1000

function getSessionStorage() {
  const secret = getAuthSecret()
  if (!secret) {
    throw new Error('Missing required env var: AUTH_SECRET')
  }
  if (!process.env.AUTH_SECRET) {
    logger.warn('AUTH_SECRET is not set. The session cookie uses NEXTAUTH_SECRET instead.')
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

const sessionStorageCache: {
  instance?: ReturnType<typeof getSessionStorage>
} = {}

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
  const isNeedsRefresh = Date.now() > issuedAt + halfLife

  if (isNeedsRefresh) {
    logger.debug('Access token past half-life, refreshing')

    const refreshKey = user.refreshToken
    const refreshed = await deduplicatedRefresh(refreshKey, user)

    if (refreshed) {
      logger.debug('Token refresh successful')

      const updatedUser: LasiusSessionData = {
        ...user,
        accessToken: refreshed.access_token,
        expiresAt: refreshed.refreshedAt + refreshed.expires_in * 1000,
        issuedAt: refreshed.refreshedAt,
        refreshToken: refreshed.refresh_token ?? user.refreshToken,
      }

      session.set('user', updatedUser)
      const sessionCookie = await commitSession(session)

      return {
        headers: { 'Set-Cookie': sessionCookie },
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

function commitSession(
  ...arguments_: Parameters<ReturnType<typeof getSessionStorage>['commitSession']>
) {
  return sessionStorage().commitSession(...arguments_)
}

/**
 * Deduplicate concurrent refresh calls: if multiple parallel loaders trigger a refresh
 * with the same refresh token, only one network request is made. Retries up to 3 times
 * with exponential backoff (500ms → 1s → 2s) before giving up.
 */
async function deduplicatedRefresh(
  refreshKey: string,
  user: LasiusSessionData,
): Promise<null | RefreshResult> {
  const recent = recentRefreshes.get(refreshKey)
  if (recent && recent.expiresAt > Date.now()) {
    logger.debug('Reusing a completed refresh for the same refresh token')
    return recent.result
  }

  const inflight = inflightRefreshes.get(refreshKey)
  if (inflight) {
    logger.debug('Joining in-flight refresh for dedup')
    return inflight
  }

  const promise = (async () => {
    const provider = getProvider(user.tokenIssuer)

    for (let index = 0; index <= AUTH_REFRESH_BACKOFF_MS.length; index++) {
      try {
        const tokens = await provider.refreshToken(user.refreshToken)
        return tokens ? { ...tokens, refreshedAt: Date.now() } : null
      } catch (error) {
        if (index < AUTH_REFRESH_BACKOFF_MS.length) {
          const delay = AUTH_REFRESH_BACKOFF_MS[index]
          logger.warn(`Token refresh attempt ${index + 1} failed, retrying in ${delay}ms`, error)
          await new Promise((r) => setTimeout(r, delay))
        } else {
          logger.warn(
            `Token refresh failed after ${AUTH_REFRESH_BACKOFF_MS.length + 1} attempts`,
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
    const result = await promise
    if (result) rememberRefresh(refreshKey, result)
    return result
  } finally {
    inflightRefreshes.delete(refreshKey)
  }
}

function destroySession(
  ...arguments_: Parameters<ReturnType<typeof getSessionStorage>['destroySession']>
) {
  return sessionStorage().destroySession(...arguments_)
}

function getSession(cookieHeader: null | string) {
  return sessionStorage().getSession(cookieHeader)
}

/** Read user session from the request cookie */
async function getUserSession(request: Request) {
  return getSession(request.headers.get('Cookie'))
}

function rememberRefresh(refreshKey: string, result: RefreshResult) {
  const now = Date.now()
  for (const [key, entry] of recentRefreshes) {
    if (entry.expiresAt <= now) recentRefreshes.delete(key)
  }
  if (recentRefreshes.size >= RECENT_REFRESHES_LIMIT) {
    const oldestKey = recentRefreshes.keys().next().value
    if (oldestKey !== undefined) recentRefreshes.delete(oldestKey)
  }
  recentRefreshes.set(refreshKey, { expiresAt: now + REFRESH_REUSE_WINDOW_MS, result })
}

function sessionStorage() {
  if (!sessionStorageCache.instance) {
    sessionStorageCache.instance = getSessionStorage()
  }
  return sessionStorageCache.instance
}

export { type LasiusSessionData } from './types'
