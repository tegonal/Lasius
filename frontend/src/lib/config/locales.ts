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

// Import the i18n configuration

const i18nConfig = require('../../../next-i18next.config.js')

/**
 * Centralized locale configuration
 * Single source of truth for all locale-related constants
 */

// Export the supported locales from i18n config
export const SUPPORTED_LOCALES = i18nConfig.i18n.locales as string[]

// Export the default locale from i18n config
export const DEFAULT_LOCALE = i18nConfig.i18n.defaultLocale as string

// Locale cookie configuration
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'
export const LOCALE_COOKIE_MAX_AGE = 31536000 // 1 year in seconds
export const LOCALE_COOKIE_MAX_AGE_DAYS = 365 // 1 year in days (for js-cookie)

// Type for supported locales
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

// Helper to check if a locale is supported
export const isSupportedLocale = (locale: string): locale is SupportedLocale => {
  return SUPPORTED_LOCALES.includes(locale)
}

// Helper to get a valid locale with fallback
export const getValidLocale = (locale?: string | null): string => {
  if (!locale) return DEFAULT_LOCALE
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE
}
