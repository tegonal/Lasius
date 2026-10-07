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

import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz'

import { formatDateToURLParameter } from '~/lib/utils/dates'

// The zone of the server and of most users. The server uses it until the browser sends its zone.
export const DEFAULT_TIME_ZONE = 'Europe/Zurich'

export const isValidTimeZone = (value: unknown): value is string => {
  if (typeof value !== 'string' || value === '') return false
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  } catch {
    return false
  }
}

/**
 * The clock of the user on the server. `now` holds the wall time of the user's zone in the
 * fields of a server Date, so date-fns calculates the day, week and month of the user.
 */
export type UserClock = {
  /** Formats a wall time of `now` like formatISOLocale in the browser of the user. */
  formatISO: (wallTime: Date) => string
  now: Date
  /** Today of the user as yyyy-MM-dd. */
  today: string
}

export const createUserClock = (timeZone: string, instant: Date = new Date()): UserClock => {
  const now = toZonedTime(instant, timeZone)
  return {
    formatISO: (wallTime) =>
      formatInTimeZone(fromZonedTime(wallTime, timeZone), timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    now,
    today: formatDateToURLParameter(now),
  }
}
