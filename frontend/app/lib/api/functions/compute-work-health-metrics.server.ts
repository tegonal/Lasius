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

import { format, getWeek, getWeekYear, subWeeks } from 'date-fns'

import { durationInHoursAsNumber } from '~/lib/utils/duration'
import { type ModelsBooking } from '~/services/api/lasius/modelsBooking'

export type BurnoutLevel = 'healthy' | 'risk' | 'warning'

export type BurnoutMetrics = {
  averageDailyHours: number
  consecutiveDays: number
  level: BurnoutLevel
  overtimePercentage: number
  plannedHours: number
  weeklyHours: number
}

export type WeekData = {
  hours: number
  plannedHours: number
  weekLabel: string
  weekNumber: number
  year: number
}

type WeekTotals = { dates: Set<string>; hours: number }

const weekOf = (date: Date) => {
  const weekNumber = getWeek(date, { weekStartsOn: 1 })
  const year = getWeekYear(date, { weekStartsOn: 1 })
  return { key: `${year}-W${weekNumber}`, weekNumber, year }
}

const groupBookingsByWeek = (bookings: ModelsBooking[]): Map<string, WeekTotals> => {
  const weekMap = new Map<string, WeekTotals>()
  for (const booking of bookings) {
    const startDateTime = booking.start?.dateTime
    const endDateTime = booking.end?.dateTime
    if (!startDateTime || !endDateTime) continue

    const bookingDate = new Date(startDateTime)
    const { key } = weekOf(bookingDate)
    const totals = weekMap.get(key) ?? { dates: new Set<string>(), hours: 0 }
    totals.hours += durationInHoursAsNumber(startDateTime, endDateTime)
    totals.dates.add(format(bookingDate, 'yyyy-MM-dd'))
    weekMap.set(key, totals)
  }
  return weekMap
}

const burnoutLevel = (
  weeklyHours: number,
  plannedWeeklyHours: number,
  workingDays: number,
  averageDailyHours: number,
): BurnoutLevel => {
  if (weeklyHours > plannedWeeklyHours * 1.25 || workingDays >= 7 || averageDailyHours > 10) {
    return 'risk'
  }
  if (weeklyHours > plannedWeeklyHours * 1.1 || workingDays >= 6 || averageDailyHours >= 9) {
    return 'warning'
  }
  return 'healthy'
}

/**
 * Compute work health metrics including burnout indicators and weekly trends.
 * Pure server-side function ported from the useWorkHealthMetrics client hook.
 *
 * @param bookings - Booking records for the analysis period
 * @param plannedWeeklyHours - Weekly planned hours
 * @param weeksToAnalyze - Number of weeks to analyze
 * @param referenceDate - ISO date string used as reference point
 */
export const computeWorkHealthMetrics = (
  bookings: ModelsBooking[],
  plannedWeeklyHours: number,
  weeksToAnalyze: number,
  referenceDate: string,
): { burnoutMetrics: BurnoutMetrics | null; weeklyData: WeekData[] } => {
  if (!bookings || bookings.length === 0) {
    return { burnoutMetrics: null, weeklyData: [] }
  }

  const weekMap = groupBookingsByWeek(bookings)
  const weeks: WeekData[] = Array.from({ length: weeksToAnalyze }, (_, index) => {
    const { key, weekNumber, year } = weekOf(
      subWeeks(new Date(referenceDate), weeksToAnalyze - 1 - index),
    )
    return {
      hours: weekMap.get(key)?.hours || 0,
      plannedHours: plannedWeeklyHours,
      weekLabel: `W${weekNumber}/${year}`,
      weekNumber,
      year,
    }
  })

  // The burnout metrics describe the current week, which is the last entry.
  const currentWeek = weeks.at(-1)
  if (!currentWeek) {
    return { burnoutMetrics: null, weeklyData: weeks }
  }

  // The number of working days of the current week stands in for consecutive days.
  const consecutiveDays =
    weekMap.get(`${currentWeek.year}-W${currentWeek.weekNumber}`)?.dates.size || 0
  const averageDailyHours = consecutiveDays > 0 ? currentWeek.hours / consecutiveDays : 0

  return {
    burnoutMetrics: {
      averageDailyHours,
      consecutiveDays,
      level: burnoutLevel(
        currentWeek.hours,
        plannedWeeklyHours,
        consecutiveDays,
        averageDailyHours,
      ),
      overtimePercentage: (currentWeek.hours / plannedWeeklyHours) * 100 - 100,
      plannedHours: plannedWeeklyHours,
      weeklyHours: currentWeek.hours,
    },
    weeklyData: weeks,
  }
}
