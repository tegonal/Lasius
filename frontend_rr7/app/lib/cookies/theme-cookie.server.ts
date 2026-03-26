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

import { parse, serialize } from 'cookie'

export type Theme = 'dark' | 'light'

const COOKIE_NAME = 'theme'
const MAX_AGE = 60 * 60 * 24 * 365 // 1 year

export function isValidTheme(value?: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

/**
 * Parse the theme from a Cookie header string.
 * Returns a valid Theme or null.
 */
export function parseThemeCookie(cookieHeader: null | string): null | Theme {
  if (!cookieHeader) return null
  const cookies = parse(cookieHeader)
  const value = cookies[COOKIE_NAME]
  return isValidTheme(value) ? value : null
}

/**
 * Serialize a Set-Cookie header for the theme.
 * Uses plain values (not JSON-encoded) so the client-side FOUC script
 * can read/write the same cookie without format mismatches.
 *
 * Not httpOnly — the client-side FOUC script needs to read it.
 * Theme preference is not sensitive data.
 */
export function serializeThemeCookie(theme: Theme): string {
  return serialize(COOKIE_NAME, theme, {
    maxAge: MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}
