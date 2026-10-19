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

import { format } from 'date-fns'
import { useMemo } from 'react'

import { useCalendarData } from '~/features/calendar/calendar-data-provider'
import { getExpectedVsBookedPercentage } from '~/lib/api/functions/get-expected-vs-booked-percentage'
import { getDailyTotalsSummary } from '~/lib/api/functions/get-models-booking-summary'
import { type IsoDateString, toCalendarDay } from '~/lib/utils/dates'
import { type ModelsDailyBookingTotal } from '~/services/api/lasius'

const DEFAULT_PLANNED_HOURS = 8

/** Returns the booking count and the rounded hours of the day that `date` names. */
export const getDaySummary = (
  dailyTotals: ModelsDailyBookingTotal[] | undefined,
  date: IsoDateString,
) => {
  const dayKey = format(toCalendarDay(date), 'yyyy-MM-dd')
  return getDailyTotalsSummary((dailyTotals ?? []).filter((total) => total.date === dayKey))
}

/**
 * useCalendarDaySummary - Computes booking summary for a specific day from bulk calendar data
 *
 * Performance: No API calls - all data comes from context
 *
 * Note: plannedWorkingHours uses a fixed 8h default for now.
 *
 * @param date - ISO date string for the day to summarize
 */
export const useCalendarDaySummary = (date: IsoDateString) => {
  const { dailyTotals } = useCalendarData()
  const plannedWorkingHours = DEFAULT_PLANNED_HOURS

  const { elements, hours } = useMemo(() => getDaySummary(dailyTotals, date), [dailyTotals, date])

  // Calculate progress percentages
  const { fulfilledPercentage, progressBarPercentage } = useMemo(
    () => getExpectedVsBookedPercentage(plannedWorkingHours, hours),
    [plannedWorkingHours, hours],
  )

  return {
    elements,
    fulfilledPercentage,
    hours,
    plannedWorkingHours,
    progressBarPercentage,
  }
}
