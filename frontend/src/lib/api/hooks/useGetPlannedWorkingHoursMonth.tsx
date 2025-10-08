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

import { statsSwrConfig } from 'components/ui/data-display/stats/statsSwrConfig'
import { eachDayOfInterval, endOfMonth, startOfMonth } from 'date-fns'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { getPlannedWorkingHoursForDateRange } from 'lib/api/functions/getPlannedWorkingHoursForDateRange'
import { useGetUserProfile } from 'lib/api/lasius/user/user'
import { plannedWorkingHoursStub } from 'lib/utils/date/stubPlannedWorkingHours'
import { useMemo } from 'react'

/**
 * Custom hook for calculating total planned working hours for an entire month.
 * Retrieves the user's configured working hours and sums them up for all days
 * in the month containing the given date.
 *
 * @param date - ISO date string for any day within the target month (format: 'YYYY-MM-DD')
 *
 * @returns Object containing:
 *   - plannedHoursMonth: Total planned working hours for the entire month
 *
 * @example
 * const { plannedHoursMonth } = useGetPlannedWorkingHoursMonth('2025-01-15')
 *
 * console.log(`Expected hours for January: ${plannedHoursMonth}`)
 *
 * @remarks
 * - Calculates based on the user's weekly working hour pattern
 * - Accounts for different hours on different weekdays (e.g., 8h Mon-Fri, 0h weekends)
 * - Falls back to plannedWorkingHoursStub if no working hours are configured
 * - Uses the last selected organisation from user settings
 * - Uses slow revalidation (UI_SLOW_DATA_DEDUPE_INTERVAL) as working hours rarely change
 * - Efficiently memoized to prevent unnecessary recalculations
 */
export const useGetPlannedWorkingHoursMonth = (date: IsoDateString) => {
  const { data } = useGetUserProfile({
    ...statsSwrConfig,
    swr: {
      ...statsSwrConfig.swr,
      enabled: !!date,
    },
  })

  const lastSelectedOrganisationId =
    data?.settings.lastSelectedOrganisation?.id ||
    data?.organisations.filter((item) => item.private)[0]?.organisationReference.id

  const filteredWeeks = data?.organisations.filter(
    (org) => org.organisationReference.id === lastSelectedOrganisationId,
  )

  const workingHours = useMemo(() => {
    const week =
      Array.isArray(filteredWeeks) && filteredWeeks[0]?.plannedWorkingHours
        ? filteredWeeks[0].plannedWorkingHours
        : plannedWorkingHoursStub

    return { ...plannedWorkingHoursStub, ...week }
  }, [filteredWeeks])

  const plannedHoursMonth = useMemo(() => {
    const dateObj = new Date(date)
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(dateObj),
      end: endOfMonth(dateObj),
    })

    return getPlannedWorkingHoursForDateRange(daysInMonth, workingHours)
  }, [date, workingHours])

  return { plannedHoursMonth }
}
