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

import { isToday } from 'date-fns'
import { apiTimespanWeek, IsoDateString } from 'lib/api/apiDateHandling'
import { getExpectedVsBookedPercentage } from 'lib/api/functions/getExpectedVsBookedPercentage'
import { getModelsBookingSummary } from 'lib/api/functions/getModelsBookingSummary'
import { useGetPlannedWorkingHoursByDate } from 'lib/api/hooks/useGetPlannedWorkingHoursByDate'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useGetUserBookingListByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import { UI_SLOW_DATA_DEDUPE_INTERVAL } from 'projectConfig/intervals'
import { useMemo } from 'react'

/**
 * Custom hook for retrieving a comprehensive summary of bookings for a specific week.
 * Fetches all bookings for the week containing the given date, calculates totals, and compares
 * them against planned working hours to provide progress metrics.
 *
 * @param date - ISO date string for any day within the target week (format: 'YYYY-MM-DD')
 *
 * @returns Object containing:
 *   - hours: Total hours booked for the week
 *   - minutes: Total minutes booked for the week
 *   - bookings: Array of bookings for the week
 *   - plannedWorkingHours: Expected working hours for the week
 *   - fulfilledPercentage: Percentage of planned hours completed (capped at 100%)
 *   - progressBarPercentage: Actual percentage for progress bar display (can exceed 100%)
 *
 * @example
 * const weeklySummary = useGetBookingSummaryWeek('2025-01-15')
 *
 * console.log(`Worked ${weeklySummary.hours} hours out of ${weeklySummary.plannedWorkingHours}`)
 * console.log(`Weekly progress: ${weeklySummary.fulfilledPercentage}%`)
 *
 * @remarks
 * - Uses aggressive revalidation for current week (2s dedupe) for real-time updates
 * - Uses slower revalidation for past weeks (UI_SLOW_DATA_DEDUPE_INTERVAL)
 * - The date parameter can be any day within the week - it will fetch the entire week
 * - Includes comparison against planned working hours aggregated for the week
 * - Week boundaries respect the configured week start day
 */
export const useGetBookingSummaryWeek = (date: IsoDateString) => {
  const { selectedOrganisationId } = useOrganisation()
  const { plannedHoursWeek: plannedWorkingHours } = useGetPlannedWorkingHoursByDate(date)
  const day = new Date(date)

  const { data: bookings } = useGetUserBookingListByOrganisation(
    selectedOrganisationId,
    apiTimespanWeek(date),
    {
      swr: {
        enabled: !!date,
        revalidateOnFocus: isToday(day),
        revalidateIfStale: isToday(day),
        dedupingInterval: isToday(day) ? 2000 : UI_SLOW_DATA_DEDUPE_INTERVAL,
      },
    },
  )

  const summary = useMemo(() => getModelsBookingSummary(bookings || []), [bookings])

  const { fulfilledPercentage, progressBarPercentage } = getExpectedVsBookedPercentage(
    plannedWorkingHours,
    summary.hours,
  )

  return {
    ...summary,
    plannedWorkingHours,
    fulfilledPercentage,
    progressBarPercentage,
  }
}
