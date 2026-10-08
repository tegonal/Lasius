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

import { addMonths, addWeeks } from 'date-fns'

import { getMonthOfDate, getWeekOfDate, type IsoDateString } from '~/lib/utils/dates'

export type CalendarViewType = 'month' | 'week'

/** The days of the month or the week that contains the date. */
export const getPeriod = (date: Date | IsoDateString, viewType: CalendarViewType) =>
  viewType === 'month' ? getMonthOfDate(date) : getWeekOfDate(date)

/** The date moved by a number of months or weeks. */
export const shiftByPeriod = (date: Date, viewType: CalendarViewType, amount: number) =>
  viewType === 'month' ? addMonths(date, amount) : addWeeks(date, amount)
