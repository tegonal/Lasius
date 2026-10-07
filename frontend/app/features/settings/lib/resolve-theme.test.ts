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

import { resolveThemeCookieValue } from './resolve-theme'

describe('resolveThemeCookieValue', () => {
  it('keeps an explicit choice, whatever the device prefers', () => {
    expect(resolveThemeCookieValue('light', true)).toBe('light')
    expect(resolveThemeCookieValue('light', false)).toBe('light')
    expect(resolveThemeCookieValue('dark', true)).toBe('dark')
    expect(resolveThemeCookieValue('dark', false)).toBe('dark')
  })

  it('resolves the system choice to the colour scheme of the device', () => {
    expect(resolveThemeCookieValue('system', true)).toBe('dark')
    expect(resolveThemeCookieValue('system', false)).toBe('light')
  })
})
