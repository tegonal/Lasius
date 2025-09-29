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

  // Parse date
  let day = 1,
    month = 0,
    year = new Date().getFullYear()
  let hasValidDate = false
  let isDatePartial = false

  if (dateString && dateString !== '__.__.____') {
    const dateParts = dateString.split('.')
    if (dateParts.length === 3) {
      const [d, m, y] = dateParts
      const parsedDay = parseInt(d, 10)
      const parsedMonth = parseInt(m, 10)
      const parsedYear = parseInt(y, 10)

      // Check if all parts are complete (not partial)
      const isDayComplete = d.length === 2 && !isNaN(parsedDay)
      const isMonthComplete = m.length === 2 && !isNaN(parsedMonth)
      const isYearComplete = y.length === 4 && !isNaN(parsedYear)

      // Track if input is partial
      isDatePartial = !isDayComplete || !isMonthComplete || !isYearComplete

      // Only validate if all segments are complete
      if (isDayComplete && isMonthComplete && isYearComplete) {
        if (
          parsedDay >= 1 &&
          parsedDay <= 31 &&
          parsedMonth >= 1 &&
          parsedMonth <= 12 &&
          parsedYear >= 1900 &&
          parsedYear <= 2100
        ) {
          day = parsedDay
          month = parsedMonth - 1
          year = parsedYear
          hasValidDate = true
        } else {
          return { date: null, isValid: false, isPartial: false }
        }
      } else {
        // Partial input - not invalid, just incomplete
        return { date: null, isValid: true, isPartial: true }
      }
    } else {
      // Wrong format but could be typing
      return { date: null, isValid: true, isPartial: true }
    }
  }

  // Parse time
  let hours = 0,
    minutes = 0
  let hasValidTime = false
  let isTimePartial = false

  if (timeString && timeString !== '__:__') {
    const timeParts = timeString.split(':')
    if (timeParts.length === 2) {
      const [h, m] = timeParts
      const parsedHours = parseInt(h, 10)
      const parsedMinutes = parseInt(m, 10)

      // Check if all parts are complete
      const isHoursComplete = h.length === 2 && !isNaN(parsedHours)
      const isMinutesComplete = m.length === 2 && !isNaN(parsedMinutes)

      // Track if input is partial
      isTimePartial = !isHoursComplete || !isMinutesComplete

      if (isHoursComplete && isMinutesComplete) {
        if (parsedHours >= 0 && parsedHours <= 23 && parsedMinutes >= 0 && parsedMinutes <= 59) {
          hours = parsedHours
          minutes = parsedMinutes
          hasValidTime = true
        } else {
          return { date: null, isValid: false, isPartial: false }
        }
      } else {
        // Partial input - not invalid, just incomplete
        if (!dateString || dateString === '__.__.____') {
          // If no date, partial time is ok
          return { date: null, isValid: true, isPartial: true }
        }
        // If there's a date, we need to handle partial time differently
        isTimePartial = true
      }
    } else {
      // Wrong format but could be typing
      return { date: null, isValid: true, isPartial: true }
    }
  } else if (!timeString || timeString === '__:__') {
    // Time is optional, so no time is still valid
    hasValidTime = true
  }

  // Only create date if we have valid date or time
  if (!hasValidDate && !hasValidTime) {
    // If both are partial or empty, it's ok
    return { date: null, isValid: true, isPartial: isDatePartial || isTimePartial }
  }

  const date = new Date(year, month, day, hours, minutes, 0, 0)

  // Validate the date is real (checks for things like Feb 31)
  if (
    hasValidDate &&
    (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year)
  ) {
    return { date: null, isValid: false, isPartial: false }
  }

  return { date, isValid: true, isPartial: false }
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
