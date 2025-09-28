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

import { match as matchLocale } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
import { NextRequest, NextResponse } from 'next/server'

// Supported locales as two-letter ISO 639-1 codes
const SUPPORTED_LOCALES = ['en', 'de']
const DEFAULT_LOCALE = 'en'
const COOKIE_NAME = 'NEXT_LOCALE'
const COOKIE_MAX_AGE = 31536000 // 1 year

/**
 * Get preferred locale from Accept-Language header using negotiator
 * Returns the best matching locale based on browser preferences
 */
function getPreferredLocale(request: NextRequest): string {
  try {
    // Convert Next.js headers to negotiator format
    const negotiatorHeaders: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      negotiatorHeaders[key] = value
    })

    // Get browser's language preferences
    const negotiator = new Negotiator({ headers: negotiatorHeaders })
    const browserLocales = negotiator.languages()

    if (process.env.LASIUS_DEBUG) {
      console.debug('[LocaleMiddleware][BrowserLocales]', browserLocales)
    }

    // Match against our supported locales
    const matchedLocale = matchLocale(browserLocales, SUPPORTED_LOCALES, DEFAULT_LOCALE)

    // Extract two-letter code if needed (e.g., 'en-US' -> 'en')
    return matchedLocale.substring(0, 2).toLowerCase()
  } catch (error) {
    if (process.env.LASIUS_DEBUG) {
      console.debug('[LocaleMiddleware][DetectionError]', error)
    }
    return DEFAULT_LOCALE
  }
}

/**
 * Middleware to detect and set user locale based on browser language
 * Sets NEXT_LOCALE cookie if not present and updates Next.js locale context
 */
export async function localeMiddleware(request: NextRequest): Promise<NextResponse | undefined> {
  console.log('[LocaleMiddleware] Checking for cookie')

  // Check if locale cookie already exists
  let locale = request.cookies.get(COOKIE_NAME)?.value
  let shouldSetCookie = false

  console.log('[LocaleMiddleware] Existing cookie:', locale)

  // Validate existing cookie or detect new locale
  if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
    // No valid cookie found - detect from browser preferences
    locale = getPreferredLocale(request)
    shouldSetCookie = true
    console.log('[LocaleMiddleware] Detected locale from browser:', locale)

    if (process.env.LASIUS_DEBUG) {
      console.debug('[LocaleMiddleware][DetectedLocale]', {
        detectedLocale: locale,
        pathname: request.nextUrl.pathname,
        acceptLanguage: request.headers.get('accept-language'),
      })
    }
  } else {
    if (process.env.LASIUS_DEBUG) {
      console.debug('[LocaleMiddleware][ExistingCookie]', {
        locale,
        pathname: request.nextUrl.pathname,
      })
    }
  }

  // Set the locale in the request headers so it's available to pages
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-middleware-request-locale', locale)

  // Create response with modified request headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Set cookie if needed
  if (shouldSetCookie) {
    console.log('[LocaleMiddleware] Setting cookie:', locale)
    response.cookies.set(COOKIE_NAME, locale, {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    if (process.env.LASIUS_DEBUG) {
      console.debug('[LocaleMiddleware][SetCookie]', {
        locale,
        cookieName: COOKIE_NAME,
      })
    }
  }

  // Also set the locale in response headers
  response.headers.set('x-middleware-request-locale', locale)

  return response
}
