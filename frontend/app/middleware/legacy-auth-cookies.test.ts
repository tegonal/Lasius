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

import { describe, expect, it } from 'vitest'

import { expireLegacyAuthCookies } from './legacy-auth-cookies'

describe('expireLegacyAuthCookies', () => {
  it('expires every NextAuth cookie, including the chunks of a session token', () => {
    const header = [
      'next-auth.csrf-token=a',
      'next-auth.session-token.0=b',
      'next-auth.session-token.1=c',
      'next-auth.callback-url=d',
    ].join('; ')
    expect(expireLegacyAuthCookies(header)).toEqual([
      'next-auth.csrf-token=; Path=/; Max-Age=0',
      'next-auth.session-token.0=; Path=/; Max-Age=0',
      'next-auth.session-token.1=; Path=/; Max-Age=0',
      'next-auth.callback-url=; Path=/; Max-Age=0',
    ])
  })

  it('adds Secure for a __Secure- or __Host- cookie', () => {
    const header = '__Secure-next-auth.session-token=a; __Host-next-auth.csrf-token=b'
    expect(expireLegacyAuthCookies(header)).toEqual([
      '__Secure-next-auth.session-token=; Path=/; Max-Age=0; Secure',
      '__Host-next-auth.csrf-token=; Path=/; Max-Age=0; Secure',
    ])
  })

  it('keeps the cookies of the current app', () => {
    expect(expireLegacyAuthCookies('_lasius_session=a; lng=de; theme=dark')).toEqual([])
  })

  it('returns an empty list without a Cookie header', () => {
    expect(expireLegacyAuthCookies(null)).toEqual([])
  })
})
