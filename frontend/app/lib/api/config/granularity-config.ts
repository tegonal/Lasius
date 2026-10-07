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

import { type ModelsBookingStatsCategory } from '~/services/api/lasius'

export type Granularity = 'Day' | 'Month' | 'Week' | 'Year'

// Counts the days from `from` up to `to` or today, whichever comes first.
// Returns null when the range starts in the future.
const countPastDays = (from: string, to: string): null | number => {
  const today = new Date()
  const fromDate = new Date(from)

  if (fromDate > today) {
    return null
  }

  const effectiveToDate = Math.min(new Date(to).getTime(), today.getTime())
  return differenceInCalendarDays(effectiveToDate, fromDate)
}

/**
 * Determines the appropriate granularity based on the date range.
 * Only counts days in the past (up to today), future days are ignored.
 */
export const getAdaptiveGranularity = (from: string, to: string): Granularity => {
  const days = countPastDays(from, to)

  if (days === null || days <= 14) {
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
 */
export const shouldUseBarChart = (from: string, to: string): boolean => {
  const days = countPastDays(from, to)
  return days === null || days <= 2
}

/**
 * Formats a category label based on granularity.
 */
export const getCategoryLabel = (
  item: ModelsBookingStatsCategory,
  granularity: Granularity,
): string => {
  switch (granularity) {
    case 'Day': {
      return `${item.day}.${item.month}`
    }
    case 'Month': {
      return `${item.month}.${item.year}`
    }
    case 'Week': {
      return `W ${item.week}`
    }
    case 'Year': {
      return String(item.year)
    }
    default: {
      return ''
    }
  }
}
