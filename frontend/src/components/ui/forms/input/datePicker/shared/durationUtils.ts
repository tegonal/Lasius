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
 * Calculate duration in minutes between two dates
 */
export function calculateDurationMinutes(start: Date | null, end: Date | null): number {
  if (!start || !end) return 0
  const diffMs = end.getTime() - start.getTime()
  return Math.floor(diffMs / (1000 * 60))
}

/**
 * Format duration in minutes to HH:MM format
 */
export function formatDuration(totalMinutes: number): string {
  const absMinutes = Math.abs(totalMinutes)
  const hours = Math.floor(absMinutes / 60)
  const minutes = absMinutes % 60
  const sign = totalMinutes < 0 ? '-' : ''
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Parse duration string (HH:MM) to minutes
 */
export function parseDuration(durationString: string): number | null {
  const match = durationString.match(/^(-)?(\d{1,2}):(\d{2})$/)
  if (!match) return null

  const [, sign, hoursStr, minutesStr] = match
  const hours = parseInt(hoursStr, 10)
  const minutes = parseInt(minutesStr, 10)

  if (minutes >= 60) return null

  const totalMinutes = hours * 60 + minutes
  return sign === '-' ? -totalMinutes : totalMinutes
}

/**
 * Add minutes to a date
 */
export function addMinutesToDate(date: Date, minutes: number): Date {
  const result = new Date(date)
  result.setMinutes(result.getMinutes() + minutes)
  return result
}
