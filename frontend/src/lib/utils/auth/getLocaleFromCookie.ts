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

import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from 'lib/config/locales'
import { GetServerSidePropsContext } from 'next'

/**
 * Extract locale from middleware header or locale cookie
 * @param context - Next.js GetServerSideProps context
 * @returns The locale from header/cookie or default locale from config
 */
export function getLocaleFromCookie(context: GetServerSidePropsContext): string {
  // First check if middleware set the locale in headers
  const headerLocale = context.req.headers['x-middleware-request-locale'] as string
  if (headerLocale) {
    return headerLocale
  }

  // Fall back to reading directly from cookie
  const cookies = context.req.headers.cookie || ''
  const localeCookie = cookies.split(';').find((c) => c.trim().startsWith(`${LOCALE_COOKIE_NAME}=`))

  return localeCookie?.split('=')[1]?.trim() || DEFAULT_LOCALE
}
