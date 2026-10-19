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

import { eachWeekOfInterval, endOfMonth, format, getWeek, startOfMonth } from 'date-fns'

import { durationMsToHours } from '~/lib/api/functions/get-models-booking-summary'
import { toCalendarDay } from '~/lib/utils/dates'
import { type ModelsDailyBookingTotal } from '~/services/api/lasius'

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const weekLabel = (date: Date) => `Week ${getWeek(date, { weekStartsOn: 1 })}`

/**
 * Hours per weekday (one row each, Monday first) and per week of the month, in the Nivo stream
 * format. The keys list only the weeks that have booked hours.
 */
export const computeStreamChartData = (
  dailyTotals: ModelsDailyBookingTotal[],
  selectedDate: string,
) => {
  const dateObject = toCalendarDay(selectedDate)
  const weekLabels = eachWeekOfInterval(
    { end: endOfMonth(dateObject), start: startOfMonth(dateObject) },
    { weekStartsOn: 1 },
  ).map((weekStart) => weekLabel(weekStart))

  const hours = new Map<string, number>()
  for (const dailyTotal of dailyTotals) {
    const day = toCalendarDay(dailyTotal.date)
    const week = weekLabel(day)
    if (!weekLabels.includes(week)) continue
    const key = `${format(day, 'EEE')}|${week}`
    hours.set(key, (hours.get(key) ?? 0) + durationMsToHours(dailyTotal.durationMs))
  }

  const data = WEEK_DAYS.map((day) =>
    Object.fromEntries(
      weekLabels.map((week) => [week, Number((hours.get(`${day}|${week}`) ?? 0).toFixed(2))]),
    ),
  )
  // weekLabels is in calendar order, also across the turn of the year.
  const keys = weekLabels.filter((week) => data.some((row) => (row[week] ?? 0) > 0))

  return { data, keys }
}
