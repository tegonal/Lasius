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

import { formatISOLocale } from '~/lib/utils/dates'

/**
 * Stub `t` function — at module level we just return the defaultValue (or key).
 * The real `t()` runs in the component where `useTranslation` is available.
 */
const t = (key: string, opts?: { defaultValue?: string }) =>
  opts?.defaultValue ?? key

export interface DateOption {
  dateRangeFn: (day: Date) => { from: string; to: string }
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
    name: t('time.yesterday', { defaultValue: 'Yesterday' }),
  },
  {
    dateRangeFn: (day: Date) => ({
      from: formatISOLocale(startOfWeek(day, { weekStartsOn: 1 })),
      to: formatISOLocale(endOfWeek(day, { weekStartsOn: 1 })),
    }),
    name: t('time.thisWeek', { defaultValue: 'This week' }),
  },
  {
    dateRangeFn: (day: Date) => ({
      from: formatISOLocale(startOfMonth(day)),
      to: formatISOLocale(endOfMonth(day)),
    }),
    name: t('time.thisMonth', { defaultValue: 'This month' }),
  },
  {
    dateRangeFn: (day: Date) => ({
      from: formatISOLocale(startOfQuarter(day)),
      to: formatISOLocale(endOfQuarter(day)),
    }),
    name: t('time.thisQuarter', { defaultValue: 'This quarter' }),
  },
  {
    dateRangeFn: (day: Date) => ({
      from: formatISOLocale(startOfYear(day)),
      to: formatISOLocale(endOfYear(day)),
    }),
    name: t('time.thisYear', { defaultValue: 'This year' }),
  },
  {
    dateRangeFn: (day: Date) => {
      const ref = addWeeks(day, -1)
      return {
        from: formatISOLocale(startOfWeek(ref, { weekStartsOn: 1 })),
        to: formatISOLocale(endOfWeek(ref, { weekStartsOn: 1 })),
      }
    },
    name: t('time.lastWeek', { defaultValue: 'Last week' }),
  },
  {
    dateRangeFn: (day: Date) => {
      const ref = addMonths(day, -1)
      return {
        from: formatISOLocale(startOfMonth(ref)),
        to: formatISOLocale(endOfMonth(ref)),
      }
    },
    name: t('time.lastMonth', { defaultValue: 'Last month' }),
  },
  {
    dateRangeFn: (day: Date) => {
      const ref = addQuarters(day, -1)
      return {
        from: formatISOLocale(startOfQuarter(ref)),
        to: formatISOLocale(endOfQuarter(ref)),
      }
    },
    name: t('time.lastQuarter', { defaultValue: 'Last quarter' }),
  },
  {
    dateRangeFn: (day: Date) => {
      const ref = addYears(day, -1)
      return {
        from: formatISOLocale(startOfYear(ref)),
        to: formatISOLocale(endOfYear(ref)),
      }
    },
    name: t('time.lastYear', { defaultValue: 'Last year' }),
  },
  {
    dateRangeFn: (day: Date) => ({
      from: formatISOLocale(startOfDay(day)),
      to: formatISOLocale(endOfDay(day)),
    }),
    name: t('custom', { defaultValue: 'Custom' }),
  },
]
