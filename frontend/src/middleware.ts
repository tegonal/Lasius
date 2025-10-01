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
import { NextRequest, NextResponse } from 'next/server'

import { authMiddleware } from './middleware/auth'
import { localeMiddleware } from './middleware/locale'

/**
 * Native Next.js 15 middleware composition
 * Chains locale and auth middleware together
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  logger.info('[Middleware] Processing:', pathname)

  // Skip middleware for Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') || // static files with extensions
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Run locale middleware first - it always returns a response
  const localeResponse = await localeMiddleware(request)

  // Run auth middleware - it returns undefined for non-protected paths
  const authResponse = await authMiddleware(request)

  // If auth returns a response (redirect to login), preserve locale cookies
  if (authResponse && authResponse instanceof NextResponse) {
    // Copy any cookies set by locale middleware
    localeResponse?.cookies.getAll().forEach((cookie) => {
      authResponse.cookies.set(cookie)
    })
    logger.info('[Middleware] Auth redirect')
    return authResponse
  }

  // Return locale response (with any new cookies)
  logger.info('[Middleware] Continue with locale response')
  return localeResponse || NextResponse.next()
}

export const config = {
  runtime: 'nodejs', // Use Node.js runtime instead of Edge runtime
  matcher: [
    // Match all pages
    '/',
    '/user/:path*',
    '/organisation/:path*',
    '/project/:path*',
    '/projects/:path*',
    '/settings/:path*',
    '/login',
    '/join/:path*',
    '/internal_oauth/:path*',
    '/dev/:path*',
    // Match API routes except Next.js internal ones
    '/api/:path*',
  ],
}
