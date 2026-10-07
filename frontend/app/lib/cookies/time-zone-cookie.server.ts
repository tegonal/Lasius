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

import { parseCookie } from 'cookie'

import {
  createUserClock,
  DEFAULT_TIME_ZONE,
  isValidTimeZone,
  type UserClock,
} from '~/lib/utils/time-zone'

// The inline script `timeZoneInitScript` in root.tsx writes this cookie with the zone of the browser.
export const TIME_ZONE_COOKIE_NAME = 'tz'

export const parseTimeZoneCookie = (cookieHeader: null | string): string => {
  if (!cookieHeader) return DEFAULT_TIME_ZONE
  const value = parseCookie(cookieHeader)[TIME_ZONE_COOKIE_NAME]
  return isValidTimeZone(value) ? value : DEFAULT_TIME_ZONE
}

/** The current time in the zone of the browser that sent the request. */
export const getUserClock = (request: Request): UserClock =>
  createUserClock(parseTimeZoneCookie(request.headers.get('Cookie')))
