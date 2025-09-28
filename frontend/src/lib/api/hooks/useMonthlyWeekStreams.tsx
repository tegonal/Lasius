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
import { apiTimespanMonth } from 'lib/api/apiDateHandling'
import { getModelsBookingSummary } from 'lib/api/functions/getModelsBookingSummary'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsBooking } from 'lib/api/lasius'
import { useGetUserBookingListByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import {
  MonthlyWeekStreamChartData,
  MonthlyWeekStreamDataItem,
  validateMonthlyWeekStreamChartData,
} from 'lib/schemas/chartSchemas'
import { useMemo } from 'react'

export const useMonthlyWeekStreams = (date: string): MonthlyWeekStreamChartData => {
  const { selectedOrganisationId } = useOrganisation()

  // Fetch all bookings for the month
  const { data: monthBookings, isLoading } = useGetUserBookingListByOrganisation(
    selectedOrganisationId,
    apiTimespanMonth(date),
    {
      swr: {
        enabled: !!date && !!selectedOrganisationId,
        revalidateOnFocus: false,
        dedupingInterval: 30000,
      },
    },
  )

  const streamData = useMemo((): MonthlyWeekStreamDataItem[] => {
    // Return empty array with 7 items for consistent structure
    const emptyData: MonthlyWeekStreamDataItem[] = Array(7)
      .fill(null)
      .map(() => ({}))
    if (!monthBookings || monthBookings.length === 0) return emptyData

    // Get all weeks in the month
    const dateObj = new Date(date)
    const monthStart = startOfMonth(dateObj)
    const monthEnd = endOfMonth(dateObj)
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })

    // Initialize data structure matching Nivo format
    // 7 objects (one per weekday), each with properties for each week
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const data: MonthlyWeekStreamDataItem[] = []

    // Create a map to store hours by day and week
    const hoursMap: Record<string, Record<string, number>> = {}
    weekDays.forEach((day) => {
      hoursMap[day] = {}
      weeks.forEach((weekStart) => {
        const weekNum = getWeek(weekStart, { weekStartsOn: 1 })
        hoursMap[day][`Week ${weekNum}`] = 0
      })
    })

    // Process bookings and aggregate by day and week
    monthBookings.forEach((booking: ModelsBooking) => {
      const bookingDate = new Date(booking.start.dateTime)
      const dayName = format(bookingDate, 'EEE')
      const weekNum = getWeek(bookingDate, { weekStartsOn: 1 })
      const weekLabel = `Week ${weekNum}`

      if (hoursMap[dayName] && hoursMap[dayName][weekLabel] !== undefined) {
        const hours = getModelsBookingSummary([booking]).hours
        hoursMap[dayName][weekLabel] += hours
      }
    })

    // Convert map to Nivo format: array of objects
    // Each object represents a weekday with week properties
    weekDays.forEach((day) => {
      const dayData: MonthlyWeekStreamDataItem = {}
      Object.keys(hoursMap[day]).forEach((weekLabel) => {
        dayData[weekLabel] = Number(hoursMap[day][weekLabel].toFixed(2))
      })
      data.push(dayData)
    })

    return data
  }, [monthBookings, date])

  // Get the list of week keys for the stream chart - only include weeks that have data
  const weekKeys = useMemo((): string[] => {
    if (streamData.length === 0) return []

    // Collect all week keys that actually exist in the data
    const allKeys = new Set<string>()
    streamData.forEach((dayData) => {
      Object.keys(dayData).forEach((key) => {
        if (key.startsWith('Week')) {
          // Check if this week has any non-zero hours
          const hasHours = streamData.some((d) => (d[key] as number) > 0)
          if (hasHours) {
            allKeys.add(key)
          }
        }
      })
    })

    return Array.from(allKeys).sort()
  }, [streamData])

  // Build the result object and validate it
  const result: MonthlyWeekStreamChartData = {
    data: streamData,
    keys: weekKeys,
    isLoading: isLoading ?? false,
    hasData:
      streamData.length > 0 &&
      streamData.some((d) => weekKeys.some((week) => (d[week] as number) > 0)),
  }

  // Validate the result in development mode
  if (process.env.NODE_ENV === 'development') {
    try {
      validateMonthlyWeekStreamChartData(result)
    } catch (error) {
      console.error('Monthly week stream chart data validation failed:', error)
    }
  }

  return result
}
