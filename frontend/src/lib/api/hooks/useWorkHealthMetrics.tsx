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

import { endOfWeek, getWeek, startOfWeek, subWeeks } from 'date-fns'
import { formatDateTimeToURLParam } from 'lib/api/apiDateHandling'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useGetUserBookingListByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import { durationInHoursAsNumber } from 'lib/utils/date/dates'
import { useMemo } from 'react'

export type BurnoutLevel = 'healthy' | 'warning' | 'risk'

export type WeekData = {
  weekNumber: number
  weekLabel: string
  hours: number
  plannedHours: number
  year: number
}

export type BurnoutMetrics = {
  level: BurnoutLevel
  weeklyHours: number
  plannedHours: number
  overtimePercentage: number
  consecutiveDays: number
  averageDailyHours: number
  message: string
}

/**
 * Hook to calculate work health metrics including burnout indicators and weekly trends
 * @param plannedWeeklyHours - Weekly planned hours (default 40)
 * @param weeksToAnalyze - Number of weeks to analyze (default 12, can be set to 26 for 6 months)
 * @param referenceDate - The date to use as reference for calculations (default: today)
 */
export const useWorkHealthMetrics = (
  plannedWeeklyHours: number = 40,
  weeksToAnalyze: number = 12,
  referenceDate?: string,
) => {
  const { selectedOrganisationId } = useOrganisation()

  // Calculate date range based on weeksToAnalyze and referenceDate
  const { from, to } = useMemo(() => {
    const refDate = referenceDate ? new Date(referenceDate) : new Date()
    const weekStart = startOfWeek(subWeeks(refDate, weeksToAnalyze - 1), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(refDate, { weekStartsOn: 1 })
    return {
      from: formatDateTimeToURLParam(weekStart),
      to: formatDateTimeToURLParam(weekEnd),
    }
  }, [weeksToAnalyze, referenceDate])

  // Fetch all bookings for the 12-week period
  const { data: bookings, isLoading } = useGetUserBookingListByOrganisation(
    selectedOrganisationId,
    {
      from,
      to,
    },
    {
      swr: {
        revalidateOnFocus: false,
        dedupingInterval: 300000, // Cache for 5 minutes
      },
    },
  )

  // Calculate weekly data and burnout metrics
  const { weeklyData, burnoutMetrics } = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return {
        weeklyData: [],
        burnoutMetrics: null,
      }
    }

    const refDate = referenceDate ? new Date(referenceDate) : new Date()

    // Group bookings by week
    const weekMap = new Map<string, { hours: number; dates: Set<string> }>()

    bookings.forEach((booking) => {
      if (!booking.start?.dateTime || !booking.end?.dateTime) return

      const bookingDate = new Date(booking.start.dateTime)
      const weekNum = getWeek(bookingDate, { weekStartsOn: 1 })
      const year = bookingDate.getFullYear()
      const weekKey = `${year}-W${weekNum}`
      const dateKey = bookingDate.toISOString().split('T')[0]

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, { hours: 0, dates: new Set() })
      }

      const weekData = weekMap.get(weekKey)!
      weekData.hours += durationInHoursAsNumber(booking.start.dateTime, booking.end.dateTime)
      weekData.dates.add(dateKey)
    })

    // Create weekly data array
    const weeks: WeekData[] = []
    for (let i = weeksToAnalyze - 1; i >= 0; i--) {
      const weekDate = subWeeks(refDate, i)
      const weekNum = getWeek(weekDate, { weekStartsOn: 1 })
      const year = weekDate.getFullYear()
      const weekKey = `${year}-W${weekNum}`
      const weekData = weekMap.get(weekKey)

      weeks.push({
        weekNumber: weekNum,
        weekLabel: `W${weekNum}`,
        hours: weekData?.hours || 0,
        plannedHours: plannedWeeklyHours,
        year,
      })
    }

    // Calculate burnout metrics for current week (last item in array)
    const currentWeek = weeks[weeks.length - 1]
    const overtimePercentage = (currentWeek.hours / plannedWeeklyHours) * 100 - 100

    // Calculate consecutive working days (simplified - using current week's date count)
    const currentWeekKey = `${currentWeek.year}-W${currentWeek.weekNumber}`
    const currentWeekData = weekMap.get(currentWeekKey)
    const consecutiveDays = currentWeekData?.dates.size || 0

    // Calculate average daily hours for current week
    const averageDailyHours = consecutiveDays > 0 ? currentWeek.hours / consecutiveDays : 0

    // Determine burnout level
    let level: BurnoutLevel = 'healthy'
    let message = 'workHealth.healthy'

    if (
      currentWeek.hours > plannedWeeklyHours * 1.25 || // >125% planned
      consecutiveDays >= 7 ||
      averageDailyHours > 10
    ) {
      level = 'risk'
      message = 'workHealth.risk'
    } else if (
      currentWeek.hours > plannedWeeklyHours * 1.1 || // >110% planned
      consecutiveDays >= 6 ||
      averageDailyHours >= 9
    ) {
      level = 'warning'
      message = 'workHealth.warning'
    }

    const metrics: BurnoutMetrics = {
      level,
      weeklyHours: currentWeek.hours,
      plannedHours: plannedWeeklyHours,
      overtimePercentage,
      consecutiveDays,
      averageDailyHours,
      message,
    }

    return { weeklyData: weeks, burnoutMetrics: metrics }
  }, [bookings, plannedWeeklyHours, weeksToAnalyze, referenceDate])

  return {
    weeklyData,
    burnoutMetrics,
    isLoading,
    bookings, // Expose bookings for calculating booking count
  }
}
