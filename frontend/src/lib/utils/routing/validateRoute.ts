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

import { ROUTES } from 'projectConfig/routes.constants'

// Supported locales from next-i18next config
const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'it', 'es']

/**
 * Removes locale prefix from a pathname if present
 * @param pathname - The pathname to clean
 * @returns pathname without locale prefix
 */
function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length > 0 && SUPPORTED_LOCALES.includes(segments[0])) {
    return '/' + segments.slice(1).join('/')
  }
  return pathname
}

/**
 * Validates if a URL string points to a known route in the application
 * @param urlString - The URL to validate (can be relative or absolute)
 * @param origin - The origin to use for resolving relative URLs (defaults to window.location.origin)
 * @returns true if the URL points to a valid route, false otherwise
 */
export function isValidRoute(urlString: string, origin?: string): boolean {
  try {
    const resolvedOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : '')
    const url = new URL(urlString, resolvedOrigin)
    // Strip locale prefix before validation
    const pathname = stripLocalePrefix(url.pathname)

    // List of all valid routes
    const validRoutes = [
      ...Object.values(ROUTES.USER),
      ...Object.values(ROUTES.ORGANISATION),
      ...Object.values(ROUTES.SETTINGS),
      '/join/', // Dynamic join routes
    ]

    // Check if the pathname matches any valid route
    return validRoutes.some((route) => {
      if (route.includes('/join/')) {
        return pathname.startsWith('/join/')
      }
      return pathname === route
    })
  } catch {
    return false
  }
}

/**
 * Returns a valid route URL, falling back to the home route if the provided URL is invalid
 * @param urlString - The URL to validate
 * @param fallbackRoute - The route to use as fallback (defaults to ROUTES.USER.INDEX)
 * @param origin - The origin to use for resolving relative URLs
 * @returns The original URL if valid, otherwise the fallback route
 */
export function getValidRouteOrFallback(
  urlString: string,
  fallbackRoute: string = ROUTES.USER.INDEX,
  origin?: string,
): string {
  return isValidRoute(urlString, origin) ? urlString : fallbackRoute
}
