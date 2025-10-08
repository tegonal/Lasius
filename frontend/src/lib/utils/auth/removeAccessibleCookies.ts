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

import Cookies from 'js-cookie'
import { LOCALE_COOKIE_NAME } from 'lib/config/locales'
import { IS_SERVER } from 'projectConfig/constants'

/**
 * Removes all accessible browser cookies except the locale cookie.
 * This is typically used during logout to clear session data while preserving
 * the user's language preference.
 *
 * @remarks
 * - Only runs on the client side (skipped on server)
 * - Preserves the locale cookie for language detection
 * - Attempts to remove cookies both with and without path specification
 *
 * @returns A promise that resolves when all cookies have been removed
 */
export const removeAccessibleCookies = async () => {
  if (IS_SERVER) return
  const cookies = Cookies.get()
  if (cookies) {
    // Unset known cookies here. Path names matter...
    // IMPORTANT: Preserve locale cookie as it's used for language detection
    Object.keys(cookies).forEach((cookieKey) => {
      if (cookieKey !== LOCALE_COOKIE_NAME) {
        Cookies.remove(cookieKey)
        Cookies.remove(cookieKey, { path: '/' })
      }
    })
  }
}
