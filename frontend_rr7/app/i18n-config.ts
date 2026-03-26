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

import de from '~/locales/de'
import en from '~/locales/en'
import es from '~/locales/es'
import fr from '~/locales/fr'
import it from '~/locales/it'

/** Supported application locales — matches the Next.js frontend config */
export const LOCALES = ['en', 'de', 'fr', 'it', 'es'] as const

/** Locale type derived from the LOCALES array */
export type Locale = (typeof LOCALES)[number]

/** Default locale for the application */
export const DEFAULT_LOCALE: Locale = 'en'

/** Human-readable labels for each locale (in their native language) */
export const LOCALE_LABELS: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
}

/** Type guard: checks if a string is a valid Locale */
export function isLocale(value?: null | string): value is Locale {
  return !!value && (LOCALES as ReadonlyArray<string>).includes(value)
}

/** Translation namespaces — matches locale JSON file names */
export const NAMESPACES = [
  'common',
  'auth',
  'booking-history',
  'bookings',
  'calendar',
  'context-menu',
  'dashboard',
  'help',
  'home',
  'integrations',
  'invitation',
  'navigation',
  'organisation',
  'projects',
  'settings',
  'stats',
  'system',
  'tag-manager',
  'working-hours',
] as const

/** Namespace type derived from the NAMESPACES array */
export type Namespace = (typeof NAMESPACES)[number]

export const resources = { de, en, es, fr, it }

export const defaultNS = 'common' as const

export const i18nConfig = {
  defaultNS,
  /** EN is the source language — use as fallback for untranslated keys */
  fallbackLng: DEFAULT_LOCALE,
  /**
   * Allow key lookup across all namespaces. Since all namespaces are eagerly
   * loaded, this lets utility functions and dynamic keys resolve without
   * knowing the source namespace.
   */
  fallbackNS: [...NAMESPACES] as string[],
  ns: [...NAMESPACES] as string[],
  resources,
  /** Treat empty strings as missing translations — fall back to fallbackLng */
  returnEmptyString: false,
  /** Suppress i18next sponsorship/Locize banner */
  showSupportNotice: false,
  supportedLngs: [...LOCALES] as string[],
}
