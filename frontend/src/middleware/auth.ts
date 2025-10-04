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

import { logger } from 'lib/loggerMiddleware'
import { getValidRouteOrFallback } from 'lib/utils/routing/validateRoute'
import { JWT } from 'next-auth/jwt'
import { getToken } from 'next-auth/jwt'
import { NextAuthMiddlewareOptions, NextRequestWithAuth } from 'next-auth/middleware'
import { NextMiddlewareResult } from 'next/dist/server/web/types'
import { NextRequest, NextResponse } from 'next/server'
import { ROUTES } from 'projectConfig/routes.constants'

/**
 * Parse the auth URL from environment variable or use default
 * Copied from next-auth
 */
function parseUrl(url?: string): string {
  const defaultUrl = new URL('http://localhost:3000/api/auth')

  if (url && !url.startsWith('http')) {
    url = `https://${url}`
  }

  const _url = new URL(url ?? defaultUrl)
  return (_url.pathname === '/' ? defaultUrl.pathname : _url.pathname).replace(/\/$/, '') // Remove trailing slash
}

/**
 * Main authentication middleware handler
 * Slightly adjusted implementation of next-auth to support locale
 */
async function handleAuthMiddleware(
  req: NextRequest,
  options: NextAuthMiddlewareOptions | undefined,
  onSuccess?: (token: JWT | null) => Promise<NextMiddlewareResult>,
) {
  const { pathname, search, origin, basePath } = req.nextUrl

  const signInPage = options?.pages?.signIn ?? '/api/auth/signin'
  const errorPage = options?.pages?.error ?? '/api/auth/error'
  const authPath = parseUrl(process.env.NEXTAUTH_URL)
  const publicPaths = ['/_next', '/favicon.ico']

  // Avoid infinite redirects/invalid response on paths that never require authentication
  if (
    `${basePath}${pathname}`.startsWith(authPath) ||
    [signInPage, errorPage].includes(pathname) ||
    publicPaths.some((p) => pathname.startsWith(p))
  ) {
    return
  }

  const secret = options?.secret ?? process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) {
    logger.error(`[next-auth][error][NO_SECRET]`, `\nhttps://next-auth.js.org/errors#no_secret`)

    const errorUrl = new URL(`${basePath}${errorPage}`, origin)
    errorUrl.searchParams.append('error', 'Configuration')

    return NextResponse.redirect(errorUrl)
  }

  const token = await getToken({
    req,
    decode: options?.jwt?.decode,
    cookieName: options?.cookies?.sessionToken?.name,
    secret,
  })

  const isAuthorized = (await options?.callbacks?.authorized?.({ req, token })) ?? !!token

  // the user is authorized, let the middleware handle the rest
  if (isAuthorized) return await onSuccess?.(token)

  // Validate the callback URL - if it's not a known route, use home instead
  const requestedUrl = `${basePath}${pathname}${search}`
  const validCallbackUrl = getValidRouteOrFallback(requestedUrl, ROUTES.USER.INDEX, origin)

  if (validCallbackUrl !== requestedUrl) {
    logger.warn('[AuthMiddleware] Invalid route requested, using fallback:', {
      requested: requestedUrl,
      fallback: validCallbackUrl,
    })
  }

  // the user is not logged in, redirect to the sign-in page
  const signInUrl = new URL(`${basePath}${signInPage}`, origin)
  signInUrl.searchParams.append('callbackUrl', validCallbackUrl)
  return NextResponse.redirect(signInUrl)
}

/**
 * Handle token refresh if expired
 * This middleware implements a workaround as next-auth has some issues storing the
 * updated token in the session-cookie after refreshing it.
 */
async function handleTokenRefresh(request: NextRequestWithAuth): Promise<NextResponse> {
  if (process.env.LASIUS_DEBUG) {
    logger.debug('[AuthMiddleware][Request]', request.url, request.nextauth.token)
  }

  let setCookies: string[] = []
  const requestHeaders = request.headers

  // Check if token is expired
  if (
    request.nextauth.token?.expires_at &&
    Date.now() >= request.nextauth.token.expires_at * 1000
  ) {
    if (process.env.LASIUS_DEBUG) {
      logger.debug('[AuthMiddleware][AccessTokenExpired]')
    }

    // Fetch new session
    const session = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/session`, {
      headers: {
        'content-type': 'application/json',
        cookie: request.cookies.toString(),
      },
    } satisfies RequestInit)

    let json = {}
    let data = null

    try {
      // Check if response is ok and content-type is JSON
      if (session.ok && session.headers.get('content-type')?.includes('application/json')) {
        json = await session.json()
        data = Object.keys(json).length > 0 ? json : null
      } else {
        // Log error response for debugging
        const errorText = await session.text()
        if (process.env.LASIUS_DEBUG) {
          logger.error('[AuthMiddleware][SessionRefreshError]', {
            status: session.status,
            statusText: session.statusText,
            response: errorText.substring(0, 200), // Log first 200 chars
          })
        }
        // If session refresh fails, redirect to login
        const signInUrl = new URL('/login', request.url)
        signInUrl.searchParams.append('callbackUrl', request.url)
        return NextResponse.redirect(signInUrl)
      }
    } catch (error) {
      if (process.env.LASIUS_DEBUG) {
        logger.error('[AuthMiddleware][SessionRefreshJSONError]', error)
      }
      // If JSON parsing fails, redirect to login
      const signInUrl = new URL('/login', request.url)
      signInUrl.searchParams.append('callbackUrl', request.url)
      return NextResponse.redirect(signInUrl)
    }

    if (process.env.LASIUS_DEBUG) {
      logger.debug('[AuthMiddleware][AccessTokenChanged]', data)
    }

    setCookies = session.headers.getSetCookie()

    // Use cookie already for queued request
    if (setCookies.length > 0) {
      setCookies.forEach((cookie) => {
        const [cookieName, cookieValue] = cookie.split('=')
        const setCookieValues = cookieValue.split(';')
        request.cookies.set(cookieName, setCookieValues[0])
      })
      requestHeaders.set('Cookie', request.cookies.toString())
      if (process.env.LASIUS_DEBUG) {
        logger.debug('[AuthMiddleware][UpgradedCookies]', request.cookies)
      }
    }
  }

  const res = NextResponse.next({
    headers: requestHeaders,
  })

  // Forward set-cookies header from previous session-renew request
  if (setCookies.length > 0) {
    setCookies.forEach((cookie) => {
      res.headers.append('Set-Cookie', cookie)
    })
    if (process.env.LASIUS_DEBUG) {
      logger.debug('[AuthMiddleware][Response][SetCookies]', setCookies)
    }
  }

  return res
}

// Protected paths that require authentication
const PROTECTED_PATHS = ['/user', '/organisation', '/project', '/projects', '/settings']

/**
 * Check if the current path requires authentication
 */
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

/**
 * Authentication middleware
 * Checks if user is authenticated and handles token refresh
 */
export async function authMiddleware(request: NextRequest): Promise<NextMiddlewareResult> {
  const { pathname } = request.nextUrl

  logger.info('[AuthMiddleware] Checking path:', pathname)

  // Skip auth check if not a protected path
  if (!isProtectedPath(pathname)) {
    logger.info('[AuthMiddleware] Not protected, skipping')
    return undefined
  }

  logger.info('[AuthMiddleware] Protected path, checking auth')

  // Handle authentication for protected paths
  return await handleAuthMiddleware(request, undefined, async (token) => {
    return handleTokenRefresh(
      Object.assign(request, {
        nextauth: {
          token,
        },
      }) as NextRequestWithAuth,
    )
  })
}
