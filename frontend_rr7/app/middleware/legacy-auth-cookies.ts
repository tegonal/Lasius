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

import { parseCookie } from 'cookie'
import { type MiddlewareFunction } from 'react-router'

/**
 * Set-Cookie values that expire the NextAuth cookies of Lasius 2.x. A chunked session token uses
 * several cookies, and together they can push the request header over the 16 KB proxy limit.
 */
export function expireLegacyAuthCookies(cookieHeader: null | string): string[] {
  if (!cookieHeader) return []
  return Object.keys(parseCookie(cookieHeader))
    .filter((name) => name.includes('next-auth.'))
    .map((name) => {
      // A browser deletes a __Secure- or __Host- cookie only with the Secure attribute.
      const isPrefixed = name.startsWith('__Secure-') || name.startsWith('__Host-')
      return `${name}=; Path=/; Max-Age=0${isPrefixed ? '; Secure' : ''}`
    })
}

export const legacyAuthCookieMiddleware: MiddlewareFunction<Response> = async (
  { request },
  next,
) => {
  const response = await next()
  const expiredCookies = expireLegacyAuthCookies(request.headers.get('Cookie'))
  for (const cookie of expiredCookies) {
    response.headers.append('Set-Cookie', cookie)
  }
  return response
}
