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
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from 'date-fns'

import { type SchemaTranslationFunction } from '~/lib/i18n-types'
import { formatISOLocale, toCalendarDay } from '~/lib/utils/dates'

type DateRange = { from: string; to: string }

/**
 * Compares two ranges by their calendar days. The server and the browser write a range bound with
 * different offsets, and on a DST change at midnight also with a different time.
 */
export const isSameDateRange = (a: DateRange, b: DateRange): boolean =>
  isSameDay(toCalendarDay(a.from), toCalendarDay(b.from)) &&
  isSameDay(toCalendarDay(a.to), toCalendarDay(b.to))

export interface DateOption {
  // A server loader passes the user clock: `day` holds the user's wall time, and formatDate adds
  // the user's offset instead of the server offset.
  dateRangeFn: (day: Date, formatDate?: (date: Date) => string) => { from: string; to: string }
  label: (t: SchemaTranslationFunction) => string
  // The English name is the stored value of a range field, so it never changes with the language.
  name: string
}

/**
 * Predefined date range options for date pickers and filters.
 * Includes common time periods like "Yesterday", "This Week", "This Month", etc.
 * Each option provides a function that returns ISO date strings for the range.
 */
export const dateOptions: DateOption[] = [
  {
    dateRangeFn: (day: Date, formatDate = formatISOLocale) => ({
      from: formatDate(startOfDay(addDays(day, -1))),
      to: formatDate(endOfDay(addDays(day, -1))),
    }),
    label: (t) => t('common:time.yesterday', { defaultValue: 'Yesterday' }),
    name: 'Yesterday',
  },
  {
    dateRangeFn: (day: Date, formatDate = formatISOLocale) => ({
      from: formatDate(startOfWeek(day, { weekStartsOn: 1 })),
      to: formatDate(endOfWeek(day, { weekStartsOn: 1 })),
    }),
    label: (t) => t('common:time.thisWeek', { defaultValue: 'This week' }),
    name: 'This week',
  },
  {
    dateRangeFn: (day: Date, formatDate = formatISOLocale) => ({
      from: formatDate(startOfMonth(day)),
      to: formatDate(endOfMonth(day)),
    }),
    label: (t) => t('common:time.thisMonth', { defaultValue: 'This month' }),
    name: 'This month',
  },
  {
    dateRangeFn: (day: Date, formatDate = formatISOLocale) => ({
      from: formatDate(startOfQuarter(day)),
      to: formatDate(endOfQuarter(day)),
    }),
    label: (t) => t('common:time.thisQuarter', { defaultValue: 'This quarter' }),
    name: 'This quarter',
  },
  {
    dateRangeFn: (day: Date, formatDate = formatISOLocale) => ({
      from: formatDate(startOfYear(day)),
      to: formatDate(endOfYear(day)),
    }),
    label: (t) => t('common:time.thisYear', { defaultValue: 'This year' }),
    name: 'This year',
  },
  {
    dateRangeFn: (day: Date, formatDate = formatISOLocale) => {
      const reference = addWeeks(day, -1)
      return {
        from: formatDate(startOfWeek(reference, { weekStartsOn: 1 })),
        to: formatDate(endOfWeek(reference, { weekStartsOn: 1 })),
      }
    },
    label: (t) => t('common:time.lastWeek', { defaultValue: 'Last week' }),
    name: 'Last week',
  },
  {
    dateRangeFn: (day: Date, formatDate = formatISOLocale) => {
      const reference = addMonths(day, -1)
      return {
        from: formatDate(startOfMonth(reference)),
        to: formatDate(endOfMonth(reference)),
      }
    },
    label: (t) => t('common:time.lastMonth', { defaultValue: 'Last month' }),
    name: 'Last month',
  },
  {
    dateRangeFn: (day: Date, formatDate = formatISOLocale) => {
      const reference = addQuarters(day, -1)
      return {
        from: formatDate(startOfQuarter(reference)),
        to: formatDate(endOfQuarter(reference)),
      }
    },
    label: (t) => t('common:time.lastQuarter', { defaultValue: 'Last quarter' }),
    name: 'Last quarter',
  },
  {
    dateRangeFn: (day: Date, formatDate = formatISOLocale) => {
      const reference = addYears(day, -1)
      return {
        from: formatDate(startOfYear(reference)),
        to: formatDate(endOfYear(reference)),
      }
    },
    label: (t) => t('common:time.lastYear', { defaultValue: 'Last year' }),
    name: 'Last year',
  },
  {
    dateRangeFn: (day: Date, formatDate = formatISOLocale) => ({
      from: formatDate(startOfDay(day)),
      to: formatDate(endOfDay(day)),
    }),
    label: (t) => t('common:custom', { defaultValue: 'Custom' }),
    name: 'Custom',
  },
]
