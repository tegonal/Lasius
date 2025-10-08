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

import { format, formatRelative, Locale } from 'date-fns'
import { de, enUS, es, fr, it } from 'date-fns/locale'
import { DEFAULT_LOCALE } from 'lib/config/locales'

/**
 * Map of locale codes to date-fns locale objects.
 * Supports 'de' (German), 'en' (English US), 'fr' (French), 'it' (Italian), and 'es' (Spanish).
 */
export const dateLocales: { [key: string]: Locale } = {
  de,
  en: enUS,
  fr,
  it,
  es,
}

/**
 * Gets the date-fns locale object for a given locale code.
 * Falls back to the default locale if the requested locale is not found.
 *
 * @param locale - The locale code (e.g., 'de', 'en')
 * @returns The corresponding date-fns Locale object
 */
export const getDateLocale = (locale: string): Locale => {
  return dateLocales[locale] || dateLocales[DEFAULT_LOCALE.substring(0, 2)]
}

/**
 * Formats a date string using date-fns with locale support.
 *
 * @param dateString - ISO date string to format
 * @param formatStr - Format string (default: 'PP' for localized date)
 * @param locale - Locale code for formatting (default: DEFAULT_LOCALE)
 * @returns Formatted date string
 *
 * @example
 * dateFormat('2024-01-15T10:30:00Z', 'PP', 'en') // "Jan 15, 2024"
 * dateFormat('2024-01-15T10:30:00Z', 'dd.MM.yyyy', 'de') // "15.01.2024"
 */
export const dateFormat = (
  dateString: string,
  formatStr: any = 'PP',
  locale: string | number = DEFAULT_LOCALE,
): string => {
  const date = new Date(dateString)
  return format(date, formatStr, {
    locale: dateLocales[locale],
  })
}

/**
 * Formats a date string relative to the current time (e.g., "2 hours ago", "yesterday").
 *
 * @param dateString - ISO date string to format
 * @param locale - Locale code for formatting (default: DEFAULT_LOCALE)
 * @returns Relative date string localized to the specified locale
 *
 * @example
 * dateFormatRelative('2024-01-15T10:30:00Z', 'en') // "yesterday at 10:30 AM"
 */
export const dateFormatRelative = (dateString: string, locale = DEFAULT_LOCALE): string => {
  const date = new Date(dateString)
  return formatRelative(date, new Date(), {
    locale: dateLocales[locale],
  })
}

/**
 * Standard time format string for displaying hours and minutes in 24-hour format.
 */
export const TIME_FORMAT = 'HH:mm'
