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

import { isValid, parse } from 'date-fns'

/**
 * Format a Date object into a date string (DD.MM.YYYY)
 */
export function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}.${m}.${y}`
}

/**
 * Format a Date object into a date string (DD.MM.YYYY)
 */
export function formatDateString(date: Date): string {
  return formatDate(date)
}

/**
 * Format hours and minutes into a time string (HH:MM)
 */
export function formatTime(hours: number, minutes: number): string {
  const h = hours.toString().padStart(2, '0')
  const m = minutes.toString().padStart(2, '0')
  return `${h}:${m}`
}

/**
 * Format a Date object into a time string (HH:MM)
 */
export function formatTimeString(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

const DATE_PLACEHOLDER = '__.__.____'
const TIME_PLACEHOLDER = '__:__'
const DATE_FORMATS = ['d.M.yyyy', 'd.M.yy']
const TIME_FORMATS = ['HH:mm', 'H:mm']

type ParseResult = { date: Date | null; isPartial: boolean; isValid: boolean }

const invalid = (): ParseResult => ({ date: null, isPartial: false, isValid: false })

/**
 * Parse date and time strings into a Date object with validation
 */
export function parseDateTimeStrings(dateString: string, timeString: string): ParseResult {
  const hasDate = Boolean(dateString) && dateString !== DATE_PLACEHOLDER
  const hasTime = Boolean(timeString) && timeString !== TIME_PLACEHOLDER

  if (!hasDate && !hasTime) {
    return { date: null, isPartial: false, isValid: true }
  }
  // An underscore marks a segment that the user has not filled in yet.
  if (dateString.includes('_') || timeString.includes('_')) {
    return { date: null, isPartial: true, isValid: true }
  }

  const date = hasDate ? parseFirstValid(normalizeShortYear(dateString), DATE_FORMATS) : null
  if (hasDate && !date) return invalid()
  if (!hasTime) return { date, isPartial: false, isValid: true }

  const time = parseFirstValid(timeString, TIME_FORMATS)
  if (!time) return invalid()
  if (!date) return { date: time, isPartial: false, isValid: true }

  date.setHours(time.getHours(), time.getMinutes(), 0, 0)
  return { date, isPartial: false, isValid: true }
}

/**
 * Expand a year of 1 to 3 digits to the current century, so `1.1.25` becomes `1.1.2025`.
 */
function normalizeShortYear(dateString: string): string {
  const parts = dateString.split('.')
  const year = parts[2]
  if (parts.length !== 3 || !year || !/^\d{1,3}$/.test(year)) return dateString
  const currentCentury = Math.floor(new Date().getFullYear() / 100) * 100
  parts[2] = String(currentCentury + Number(year))
  return parts.join('.')
}

function parseFirstValid(value: string, formats: string[]): Date | null {
  for (const format of formats) {
    const parsed = parse(value, format, new Date())
    if (isValid(parsed)) return parsed
  }
  return null
}

/**
 * The value that the picker sends to its parent, or null for no update. A complete valid entry
 * sends its ISO string. An empty date and an empty time send an empty text.
 */
export const getParentValue = (
  value: { dateString: string; isPartial: boolean; isValid: boolean; timeString: string },
  isoString: null | string,
): null | string => {
  if (value.isValid && !value.isPartial) return isoString || null
  if (!value.dateString && !value.timeString) return ''
  return null
}
