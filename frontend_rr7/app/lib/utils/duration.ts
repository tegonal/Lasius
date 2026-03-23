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

import {
  differenceInMilliseconds,
  differenceInMinutes,
  roundToNearestMinutes,
} from 'date-fns'

import { type IsoDateString } from '~/lib/utils/dates'

/**
 * Calculate duration between two ISO date strings in decimal hours.
 */
export const durationInHoursAsNumber = (
  start: IsoDateString,
  end: IsoDateString,
): number => {
  const ms = differenceInMilliseconds(new Date(end), new Date(start))
  return ms / 1000 / 60 / 60
}

/**
 * Format duration between two ISO date strings as "HH:MM".
 */
export const durationAsString = (
  start: IsoDateString,
  end: IsoDateString,
): string => {
  const minutes = differenceInMinutes(new Date(end), new Date(start))
  return decimalMinutesToTimeString(minutes)
}

/**
 * Convert decimal minutes to "HH:MM" string.
 */
const decimalMinutesToTimeString = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.abs(totalMinutes % 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * Convert decimal hours to "HH:MM" string.
 */
export const decimalHoursToDurationString = (decimalHours: number): string => {
  const totalMinutes = Math.round(decimalHours * 60)
  return decimalMinutesToTimeString(totalMinutes)
}

/**
 * Convert decimal hours to "HH:MM" string, rounded to nearest 5 minutes.
 */
export const decimalHoursToDurationStringRounded = (
  decimalHours: number,
): string => {
  const start = new Date(0, 0, 0, 0, 0)
  const end = roundToNearestMinutes(
    new Date(new Date(0, 0, 0, 0, 0).setMinutes(decimalHours * 60)),
    { nearestTo: 5 },
  )
  return decimalMinutesToTimeString(differenceInMinutes(end, start))
}
