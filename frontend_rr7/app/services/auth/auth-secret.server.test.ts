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

import { getAuthSecret } from './auth-secret.server'

describe('getAuthSecret', () => {
  it('returns AUTH_SECRET when both variables are set', () => {
    expect(getAuthSecret({ AUTH_SECRET: 'new', NEXTAUTH_SECRET: 'old' })).toBe('new')
  })

  it('falls back to NEXTAUTH_SECRET when AUTH_SECRET is not set', () => {
    expect(getAuthSecret({ NEXTAUTH_SECRET: 'old' })).toBe('old')
  })

  it('falls back to NEXTAUTH_SECRET when AUTH_SECRET is empty', () => {
    expect(getAuthSecret({ AUTH_SECRET: '', NEXTAUTH_SECRET: 'old' })).toBe('old')
  })

  it('returns undefined when neither variable holds a value', () => {
    expect(getAuthSecret({ AUTH_SECRET: '', NEXTAUTH_SECRET: '' })).toBeUndefined()
    expect(getAuthSecret({})).toBeUndefined()
  })
})
