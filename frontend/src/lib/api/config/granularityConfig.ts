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

import { differenceInCalendarDays } from 'date-fns'
import { ModelsBookingStatsCategory } from 'lib/api/lasius'
import { Granularity } from 'types/common'

/**
 * Determines the appropriate granularity based on the date range.
 * Only counts days in the past (up to today), future days are ignored.
 *
 * Adaptive logic:
 * - 0-14 past days: Day
 * - 15-60 past days: Week
 * - 61-1095 past days (3 years): Month
 * - >1095 past days: Year
 *
 * @param from - Start date (ISO string)
 * @param to - End date (ISO string)
 * @returns Granularity level
 */
export const getAdaptiveGranularity = (from: string, to: string): Granularity => {
  const today = new Date()
  const fromDate = new Date(from)
  const toDate = new Date(to)

  // Only count up to today - ignore future days
  const effectiveToDate = toDate > today ? today : toDate

  // If the entire range is in the future, use Day granularity
  if (fromDate > today) {
    return 'Day'
  }

  const days = differenceInCalendarDays(effectiveToDate, fromDate)

  if (days <= 14) {
    return 'Day'
  }
  if (days <= 60) {
    return 'Week'
  }
  if (days <= 1095) {
    return 'Month'
  }
  return 'Year'
}

/**
 * Determines if bar chart should be used instead of stream chart.
 * Bar charts are better for very short time periods (<=2 past days).
 *
 * @param from - Start date (ISO string)
 * @param to - End date (ISO string)
 * @returns True if bar chart should be used
 */
export const shouldUseBarChart = (from: string, to: string): boolean => {
  const today = new Date()
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const effectiveToDate = toDate > today ? today : toDate

  if (fromDate > today) {
    return true
  }

  const days = differenceInCalendarDays(effectiveToDate, fromDate)
  return days <= 2
}

/**
 * Formats a category label based on granularity.
 * Consistent date formats across all charts:
 * - Day: DD.MM (e.g., "15.10")
 * - Week: W XX (e.g., "W 42")
 * - Month: MM.YYYY (e.g., "10.2025")
 * - Year: YYYY (e.g., "2025")
 *
 * @param item - Booking stats category
 * @param granularity - Time granularity
 * @returns Formatted label string
 */
export const getCategoryLabel = (
  item: ModelsBookingStatsCategory,
  granularity: Granularity,
): string => {
  switch (granularity) {
    case 'Week':
      return `W ${item.week}`
    case 'Day':
      return `${item.day}.${item.month}`
    case 'Month':
      return `${item.month}.${item.year}`
    case 'Year':
      return String(item.year)
    default:
      return ''
  }
}
