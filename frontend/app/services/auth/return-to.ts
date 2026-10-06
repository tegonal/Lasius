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

const PARSE_BASE = 'https://return-to.invalid'
const MAX_LENGTH = 2048

/**
 * Returns `value` as a same-origin path, or `fallback` when it could leave the origin. The result
 * goes into a Location header, so it is the normalized, ASCII-encoded form of the path.
 */
export function sanitizeReturnTo(value: null | string | undefined, fallback = '/'): string {
  // A browser removes a tab or a newline from a URL, so `/\t/evil.com` becomes `//evil.com`.
  // Some browsers turn `\` into `/`.
  if (!value || value.length > MAX_LENGTH || /[\p{Cc}\\]/u.test(value)) return fallback
  if (!value.startsWith('/') || value.startsWith('//')) return fallback

  const url = new URL(value, PARSE_BASE)
  const path = `${url.pathname}${url.search}${url.hash}`
  // Dot segments can normalize to `//evil.com`, which a browser reads as another host.
  // Percent-encoding can grow the path ninefold, so the limit applies to the output too.
  const isSafe = url.origin === PARSE_BASE && !path.startsWith('//') && path.length <= MAX_LENGTH
  return isSafe ? path : fallback
}
