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

/**
 * Returns the visitor IP from the last `X-Forwarded-For` entry, or an empty string without a proxy.
 * The edge proxy appends the entry on the right, and a client can forge every entry to its left.
 * Other client-IP headers such as `X-Client-IP` pass the edge unchanged, so this function ignores them.
 */
export function getTrustedClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (!forwardedFor) return ''

  const entries = forwardedFor
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

  return entries.at(-1) ?? ''
}
