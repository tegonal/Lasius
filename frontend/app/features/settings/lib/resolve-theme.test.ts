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

import { afterEach, describe, expect, it, vi } from 'vitest'

import { readPrefersDark, resolveTheme, themeToApply } from './resolve-theme'

describe('themeToApply', () => {
  it('applies an explicit choice also without a known colour scheme', () => {
    expect(themeToApply('light', null)).toBe('light')
    expect(themeToApply('dark', null)).toBe('dark')
    expect(themeToApply('light', true)).toBe('light')
  })

  it('resolves the system choice only with a known colour scheme', () => {
    expect(themeToApply('system', true)).toBe('dark')
    expect(themeToApply('system', false)).toBe('light')
    expect(themeToApply('system', null)).toBeNull()
  })
})

describe('readPrefersDark', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is null without a window', () => {
    expect(readPrefersDark()).toBeNull()
  })

  it('reads the colour scheme through matchMedia', () => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('dark') }))
    expect(readPrefersDark()).toBe(true)
  })
})

describe('resolveTheme', () => {
  it('keeps an explicit choice, whatever the device prefers', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('light', false)).toBe('light')
    expect(resolveTheme('dark', true)).toBe('dark')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('resolves the system choice to the colour scheme of the device', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})
