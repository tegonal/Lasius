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

import { sanitizeReturnTo } from './return-to'

describe('sanitizeReturnTo', () => {
  it.each([
    ['/dashboard', '/dashboard'],
    ['/org/123/projects', '/org/123/projects'],
    ['/user/lists?from=2026-10-01&to=2026-10-02', '/user/lists?from=2026-10-01&to=2026-10-02'],
    ['/join/ABC123#accept', '/join/ABC123#accept'],
    ['/%2F%2Fevil.com', '/%2F%2Fevil.com'],
  ])('keeps the same-origin path %s', (value, expected) => {
    expect(sanitizeReturnTo(value)).toBe(expected)
  })

  it('encodes a non-ASCII path, because a Location header carries ASCII only', () => {
    expect(sanitizeReturnTo('/projekte/übersicht')).toBe('/projekte/%C3%BCbersicht')
  })

  it.each([
    ['an empty value', ''],
    ['a protocol-relative URL', '//evil.com'],
    ['an absolute URL', 'https://evil.com'],
    ['a javascript URL', 'javascript:alert(1)'],
    ['a path without a leading slash', 'evil.com/path'],
    ['a backslash after the slash', String.raw`/\evil.com`],
    ['an embedded backslash', String.raw`/foo\bar`],
    ['a tab that a browser removes', '/\t/evil.com'],
    ['a line feed', '/\n/evil.com'],
    ['a carriage return', '/\r/evil.com'],
    ['a NUL character', '/\u{0}/evil.com'],
    ['a DEL character', '/\u{7F}/evil.com'],
    ['a dot segment that normalizes to //', '/..//evil.com'],
    ['a single-dot segment that normalizes to //', '/.//evil.com'],
    ['a value over 2048 characters', `/${'a'.repeat(2048)}`],
    ['a value whose encoded form exceeds 2048 characters', `/${'漢'.repeat(400)}`],
  ])('rejects %s', (_case, value) => {
    expect(sanitizeReturnTo(value)).toBe('/')
  })

  it('uses a custom fallback', () => {
    expect(sanitizeReturnTo('', '/home')).toBe('/home')
  })
})
