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
 * Parse date and time strings into a Date object with validation
 */
export function parseDateTimeStrings(
  dateString: string,
  timeString: string,
): { date: Date | null; isValid: boolean; isPartial: boolean } {
  if (!dateString && !timeString) {
    return { date: null, isValid: true, isPartial: false }
  }

  // Check for placeholders
  const hasDate = dateString && dateString !== '__.__.____'
  const hasTime = timeString && timeString !== '__:__'

  if (!hasDate && !hasTime) {
    return { date: null, isValid: true, isPartial: false }
  }

  // Check if input is partial (contains underscores)
  const hasDatePlaceholder = dateString?.includes('_') || false
  const hasTimePlaceholder = timeString?.includes('_') || false

  if (hasDatePlaceholder || hasTimePlaceholder) {
    return { date: null, isValid: true, isPartial: true }
  }

  let parsedDate: Date | null = null

  // Parse date if provided
  if (hasDate) {
    const dateFormats = [
      'd.M.yyyy', // Full format: 1.1.2025
      'd.M.yy', // Short year: 1.1.25
    ]

    for (const format of dateFormats) {
      const parsed = parse(dateString, format, new Date())
      if (isValid(parsed)) {
        parsedDate = parsed
        break
      }
    }

    if (!parsedDate) {
      return { date: null, isValid: false, isPartial: false }
    }
  }

  // Parse time and combine with date if both provided
  if (hasTime && parsedDate) {
    const timeFormats = [
      'HH:mm', // Two digit format: 09:30
      'H:mm', // Single digit hour: 9:30
    ]

    let parsedTime: Date | null = null
    for (const format of timeFormats) {
      const parsed = parse(timeString, format, new Date())
      if (isValid(parsed)) {
        parsedTime = parsed
        break
      }
    }

    if (!parsedTime) {
      return { date: null, isValid: false, isPartial: false }
    }

    // Combine date and time
    parsedDate.setHours(parsedTime.getHours(), parsedTime.getMinutes(), 0, 0)
  } else if (hasTime && !hasDate) {
    // Time only (use today's date)
    const timeFormats = ['HH:mm', 'H:mm']
    const today = new Date()

    for (const format of timeFormats) {
      const parsed = parse(timeString, format, today)
      if (isValid(parsed)) {
        parsedDate = parsed
        break
      }
    }

    if (!parsedDate) {
      return { date: null, isValid: false, isPartial: false }
    }
  }

  return { date: parsedDate, isValid: true, isPartial: false }
}

/**
 * Format a Date object into a date string (DD.MM.YYYY)
 */
export function formatDateString(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}.${m}.${y}`
}

/**
 * Format a Date object into a time string (HH:MM)
 */
export function formatTimeString(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
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
 * Format a Date object into a date string (DD.MM.YYYY)
 */
export function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}.${m}.${y}`
}
