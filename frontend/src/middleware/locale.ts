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
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
} from 'lib/config/locales'
import { logger } from 'lib/loggerMiddleware'
import Negotiator from 'negotiator'
import { NextRequest, NextResponse } from 'next/server'

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
      logger.debug('[LocaleMiddleware][BrowserLocales]', browserLocales)
    }

    // Match against our supported locales
    const matchedLocale = matchLocale(browserLocales, SUPPORTED_LOCALES, DEFAULT_LOCALE)

    // Extract two-letter code if needed (e.g., 'en-US' -> 'en')
    return matchedLocale.substring(0, 2).toLowerCase()
  } catch (error) {
    if (process.env.LASIUS_DEBUG) {
      logger.debug('[LocaleMiddleware][DetectionError]', error)
    }
    return DEFAULT_LOCALE
  }
}

/**
 * Middleware to detect and set user locale based on browser language
 * Sets NEXT_LOCALE cookie if not present and updates Next.js locale context
 */
export async function localeMiddleware(request: NextRequest): Promise<NextResponse | undefined> {
  logger.info('[LocaleMiddleware] Checking for cookie')

  // Check if locale cookie already exists
  let locale = request.cookies.get(LOCALE_COOKIE_NAME)?.value
  let shouldSetCookie = false

  logger.info('[LocaleMiddleware] Existing cookie:', locale)

  // Validate existing cookie or detect new locale
  if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
    // No valid cookie found - detect from browser preferences
    locale = getPreferredLocale(request)
    shouldSetCookie = true
    logger.info('[LocaleMiddleware] Detected locale from browser:', locale)

    if (process.env.LASIUS_DEBUG) {
      logger.debug('[LocaleMiddleware][DetectedLocale]', {
        detectedLocale: locale,
        pathname: request.nextUrl.pathname,
        acceptLanguage: request.headers.get('accept-language'),
      })
    }
  } else {
    if (process.env.LASIUS_DEBUG) {
      logger.debug('[LocaleMiddleware][ExistingCookie]', {
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
    logger.info('[LocaleMiddleware] Setting cookie:', locale)
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      path: '/',
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    if (process.env.LASIUS_DEBUG) {
      logger.debug('[LocaleMiddleware][SetCookie]', {
        locale,
        cookieName: LOCALE_COOKIE_NAME,
      })
    }
  }

  // Also set the locale in response headers
  response.headers.set('x-middleware-request-locale', locale)

  return response
}
