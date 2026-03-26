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

import {
  isValidTheme,
  parseThemeCookie,
  serializeThemeCookie,
} from './theme-cookie.server'

describe('isValidTheme', () => {
  it('accepts "light"', () => {
    expect(isValidTheme('light')).toBe(true)
  })

  it('accepts "dark"', () => {
    expect(isValidTheme('dark')).toBe(true)
  })

  it('rejects "system"', () => {
    expect(isValidTheme('system')).toBe(false)
  })

  it('rejects null', () => {
    expect(isValidTheme(null)).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isValidTheme()).toBe(false)
  })

  it('rejects arbitrary strings', () => {
    expect(isValidTheme('blue')).toBe(false)
  })
})

describe('parseThemeCookie', () => {
  it('returns null for null header', () => {
    expect(parseThemeCookie(null)).toBeNull()
  })

  it('parses "light" from cookie header', () => {
    expect(parseThemeCookie('theme=light')).toBe('light')
  })

  it('parses "dark" from cookie header', () => {
    expect(parseThemeCookie('theme=dark')).toBe('dark')
  })

  it('returns null for invalid theme value', () => {
    expect(parseThemeCookie('theme=blue')).toBeNull()
  })

  it('returns null when theme cookie is absent', () => {
    expect(parseThemeCookie('lng=en')).toBeNull()
  })

  it('finds theme among multiple cookies', () => {
    expect(parseThemeCookie('lng=en; theme=dark; other=value')).toBe('dark')
  })
})

describe('serializeThemeCookie', () => {
  it('produces a Set-Cookie string with the theme value', () => {
    const result = serializeThemeCookie('dark')
    expect(result).toContain('theme=dark')
    expect(result).toContain('Path=/')
    expect(result).toContain('SameSite=Lax')
  })

  it('round-trips with parseThemeCookie', () => {
    const setCookie = serializeThemeCookie('light')
    // Extract just the key=value part (before first ;)
    const cookieValue = setCookie.split(';')[0] ?? ''
    expect(parseThemeCookie(cookieValue)).toBe('light')
  })
})
