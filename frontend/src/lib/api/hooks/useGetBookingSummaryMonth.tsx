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
import { apiTimespanMonth, IsoDateString } from 'lib/api/apiDateHandling'
import { getModelsBookingSummary } from 'lib/api/functions/getModelsBookingSummary'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useGetUserBookingListByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import { UI_SLOW_DATA_DEDUPE_INTERVAL } from 'projectConfig/intervals'
import { useMemo } from 'react'

/**
 * Custom hook for retrieving a summary of bookings for an entire month.
 * Fetches all bookings within the month containing the given date and calculates total hours and minutes.
 *
 * @param date - ISO date string for any day within the target month (format: 'YYYY-MM-DD')
 *
 * @returns Object containing:
 *   - hours: Total hours booked for the month
 *   - minutes: Total minutes booked for the month
 *   - bookings: Array of all bookings in the month
 *
 * @example
 * const monthlySummary = useGetBookingSummaryMonth('2025-01-15')
 *
 * console.log(`Total hours for January: ${monthlySummary.hours}`)
 * console.log(`Number of bookings: ${monthlySummary.bookings?.length || 0}`)
 *
 * @remarks
 * - Uses adaptive revalidation: more frequent for current month, slower for past months
 * - The date parameter can be any day within the month - it will fetch the entire month
 * - Does not include planned working hours comparison (unlike day/week summaries)
 * - Uses UI_SLOW_DATA_DEDUPE_INTERVAL for past months to optimize performance
 */
export const useGetBookingSummaryMonth = (date: IsoDateString) => {
  const { selectedOrganisationId } = useOrganisation()
  const day = new Date(date)

  const { data: bookings } = useGetUserBookingListByOrganisation(
    selectedOrganisationId,
    apiTimespanMonth(date),
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

  return {
    ...summary,
  }
}
