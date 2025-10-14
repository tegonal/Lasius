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

import { useCalendarData } from 'components/features/calendar/CalendarDataProvider'
import { isSameDay, parseISO } from 'date-fns'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { getExpectedVsBookedPercentage } from 'lib/api/functions/getExpectedVsBookedPercentage'
import { getModelsBookingSummary } from 'lib/api/functions/getModelsBookingSummary'
import { useGetPlannedWorkingHoursByDate } from 'lib/api/hooks/useGetPlannedWorkingHoursByDate'
import { useMemo } from 'react'

/**
 * useCalendarDaySummary - Computes booking summary for a specific day from bulk calendar data
 *
 * This hook:
 * - Takes the pre-fetched bulk booking data from CalendarDataProvider
 * - Filters bookings for the specific day
 * - Computes summary statistics (hours, progress, etc.)
 * - Returns the same interface as useGetBookingSummaryDay
 *
 * Performance: No API calls - all data comes from context
 *
 * @param date - ISO date string for the day to summarize
 * @returns Booking summary for the day (same structure as useGetBookingSummaryDay)
 */
export const useCalendarDaySummary = (date: IsoDateString) => {
  const { bookings } = useCalendarData()
  const { plannedHoursDay: plannedWorkingHours } = useGetPlannedWorkingHoursByDate(date)
  const targetDate = useMemo(() => new Date(date), [date])

  // Filter bookings for this specific day
  const dayBookings = useMemo(() => {
    if (!bookings) return []

    return bookings.filter((booking) => {
      const bookingDate = parseISO(booking.start.dateTime)
      return isSameDay(bookingDate, targetDate)
    })
  }, [bookings, targetDate])

  // Calculate summary for this day
  const summary = useMemo(() => getModelsBookingSummary(dayBookings), [dayBookings])

  // Calculate progress percentages
  const { fulfilledPercentage, progressBarPercentage } = useMemo(
    () => getExpectedVsBookedPercentage(plannedWorkingHours, summary.hours),
    [plannedWorkingHours, summary.hours],
  )

  return {
    ...summary,
    plannedWorkingHours,
    fulfilledPercentage,
    progressBarPercentage,
  }
}
