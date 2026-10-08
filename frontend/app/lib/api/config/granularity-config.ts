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

import { differenceInCalendarDays, min, startOfDay } from 'date-fns'

import { toCalendarDay } from '~/lib/utils/dates'
import { type ModelsBookingStatsCategory } from '~/services/api/lasius'

export type Granularity = 'Day' | 'Month' | 'Week' | 'Year'

// Counts the calendar days from `from` up to `to` or today, whichever comes first.
// Returns null when the range starts after today. A server loader passes the user clock as `today`.
const countPastDays = (from: string, to: string, today: Date): null | number => {
  const fromDay = toCalendarDay(from)
  const todayDay = startOfDay(today)

  if (fromDay > todayDay) {
    return null
  }

  return differenceInCalendarDays(min([toCalendarDay(to), todayDay]), fromDay)
}

/**
 * Determines the appropriate granularity based on the date range.
 * Only counts days in the past (up to today), future days are ignored.
 */
export const getAdaptiveGranularity = (
  from: string,
  to: string,
  today: Date = new Date(),
): Granularity => {
  const days = countPastDays(from, to, today)

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
export const shouldUseBarChart = (from: string, to: string, today: Date = new Date()): boolean => {
  const days = countPastDays(from, to, today)
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
