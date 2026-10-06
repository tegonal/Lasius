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
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  endOfYesterday,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  startOfYesterday,
} from 'date-fns'

import { type SchemaTranslationFunction } from '~/lib/i18n-types'
import { formatISOLocale } from '~/lib/utils/dates'

export interface DateOption {
  dateRangeFn: (day: Date) => { from: string; to: string }
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
    dateRangeFn: (_day: Date) => ({
      from: formatISOLocale(startOfYesterday()),
      to: formatISOLocale(endOfYesterday()),
    }),
    label: (t) => t('common:time.yesterday', { defaultValue: 'Yesterday' }),
    name: 'Yesterday',
  },
  {
    dateRangeFn: (day: Date) => ({
      from: formatISOLocale(startOfWeek(day, { weekStartsOn: 1 })),
      to: formatISOLocale(endOfWeek(day, { weekStartsOn: 1 })),
    }),
    label: (t) => t('common:time.thisWeek', { defaultValue: 'This week' }),
    name: 'This week',
  },
  {
    dateRangeFn: (day: Date) => ({
      from: formatISOLocale(startOfMonth(day)),
      to: formatISOLocale(endOfMonth(day)),
    }),
    label: (t) => t('common:time.thisMonth', { defaultValue: 'This month' }),
    name: 'This month',
  },
  {
    dateRangeFn: (day: Date) => ({
      from: formatISOLocale(startOfQuarter(day)),
      to: formatISOLocale(endOfQuarter(day)),
    }),
    label: (t) => t('common:time.thisQuarter', { defaultValue: 'This quarter' }),
    name: 'This quarter',
  },
  {
    dateRangeFn: (day: Date) => ({
      from: formatISOLocale(startOfYear(day)),
      to: formatISOLocale(endOfYear(day)),
    }),
    label: (t) => t('common:time.thisYear', { defaultValue: 'This year' }),
    name: 'This year',
  },
  {
    dateRangeFn: (day: Date) => {
      const reference = addWeeks(day, -1)
      return {
        from: formatISOLocale(startOfWeek(reference, { weekStartsOn: 1 })),
        to: formatISOLocale(endOfWeek(reference, { weekStartsOn: 1 })),
      }
    },
    label: (t) => t('common:time.lastWeek', { defaultValue: 'Last week' }),
    name: 'Last week',
  },
  {
    dateRangeFn: (day: Date) => {
      const reference = addMonths(day, -1)
      return {
        from: formatISOLocale(startOfMonth(reference)),
        to: formatISOLocale(endOfMonth(reference)),
      }
    },
    label: (t) => t('common:time.lastMonth', { defaultValue: 'Last month' }),
    name: 'Last month',
  },
  {
    dateRangeFn: (day: Date) => {
      const reference = addQuarters(day, -1)
      return {
        from: formatISOLocale(startOfQuarter(reference)),
        to: formatISOLocale(endOfQuarter(reference)),
      }
    },
    label: (t) => t('common:time.lastQuarter', { defaultValue: 'Last quarter' }),
    name: 'Last quarter',
  },
  {
    dateRangeFn: (day: Date) => {
      const reference = addYears(day, -1)
      return {
        from: formatISOLocale(startOfYear(reference)),
        to: formatISOLocale(endOfYear(reference)),
      }
    },
    label: (t) => t('common:time.lastYear', { defaultValue: 'Last year' }),
    name: 'Last year',
  },
  {
    dateRangeFn: (day: Date) => ({
      from: formatISOLocale(startOfDay(day)),
      to: formatISOLocale(endOfDay(day)),
    }),
    label: (t) => t('common:custom', { defaultValue: 'Custom' }),
    name: 'Custom',
  },
]
