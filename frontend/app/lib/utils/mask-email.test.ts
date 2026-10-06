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

import { maskEmail } from './mask-email'

describe('maskEmail', () => {
  it('masks a standard email', () => {
    expect(maskEmail('test@example.com')).toBe('t***@example.com')
  })

  it('masks a single-character local part', () => {
    expect(maskEmail('a@example.com')).toBe('a***@example.com')
  })

  it('masks a long local part', () => {
    expect(maskEmail('john.doe@company.org')).toBe('j***@company.org')
  })

  it('returns *** for empty string', () => {
    expect(maskEmail('')).toBe('***')
  })

  it('returns *** for string without @', () => {
    expect(maskEmail('no-at-sign')).toBe('***')
  })

  it('returns *** for @ at position 0', () => {
    expect(maskEmail('@domain.com')).toBe('***')
  })

  it('preserves full domain', () => {
    expect(maskEmail('user@sub.domain.co.uk')).toBe('u***@sub.domain.co.uk')
  })
})
