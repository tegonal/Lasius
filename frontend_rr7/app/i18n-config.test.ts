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

import { DEFAULT_LOCALE, isLocale, LOCALES, NAMESPACES } from './i18n-config'

describe('i18n-config', () => {
  describe('LOCALES', () => {
    it('contains all expected languages', () => {
      expect(LOCALES).toEqual(['en', 'de', 'fr', 'it', 'es'])
    })
  })

  describe('NAMESPACES', () => {
    it('contains all expected namespaces', () => {
      expect(NAMESPACES).toEqual(['common', 'integrations'])
    })
  })

  describe('DEFAULT_LOCALE', () => {
    it('is English', () => {
      expect(DEFAULT_LOCALE).toBe('en')
    })
  })

  describe('isLocale', () => {
    it('returns true for supported locales', () => {
      expect(isLocale('en')).toBe(true)
      expect(isLocale('de')).toBe(true)
      expect(isLocale('fr')).toBe(true)
      expect(isLocale('it')).toBe(true)
      expect(isLocale('es')).toBe(true)
    })

    it('returns false for unsupported locales', () => {
      expect(isLocale('zh')).toBe(false)
      expect(isLocale('ja')).toBe(false)
      expect(isLocale('xx')).toBe(false)
    })

    it('returns false for null and undefined', () => {
      expect(isLocale(null)).toBe(false)
      expect(isLocale(undefined)).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isLocale('')).toBe(false)
    })
  })
})
