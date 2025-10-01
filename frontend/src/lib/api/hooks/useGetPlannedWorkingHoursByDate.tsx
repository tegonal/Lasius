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

import { useGetUserProfile } from 'lib/api/lasius/user/user'
import { getWorkingHoursWeekdayString } from 'lib/utils/date/dates'
import { plannedWorkingHoursStub } from 'lib/utils/date/stubPlannedWorkingHours'
import { UI_SLOW_DATA_DEDUPE_INTERVAL } from 'projectConfig/intervals'

/**
 * Custom hook for retrieving planned working hours based on a given date.
 * Fetches the user's configured working hours for the selected organisation and calculates
 * daily, weekly, and aggregated planned hours across all organisations.
 *
 * @param date - ISO date string to determine the weekday for planned hours lookup
 *
 * @returns Object containing:
 *   - plannedHoursDay: Planned working hours for the specific weekday of the given date
 *   - plannedHoursWeek: Total planned working hours for the entire week
 *   - allOrganisationsByDay: Aggregated working hours by day across all user organisations
 *
 * @example
 * const { plannedHoursDay, plannedHoursWeek } = useGetPlannedWorkingHoursByDate('2025-01-15')
 *
 * console.log(`Expected hours for Wednesday: ${plannedHoursDay}`)
 * console.log(`Expected hours for the week: ${plannedHoursWeek}`)
 *
 * @remarks
 * - Falls back to plannedWorkingHoursStub if no working hours are configured
 * - Uses the last selected organisation from user settings
 * - Aggregates working hours across all organisations the user belongs to
 * - Uses slow revalidation (UI_SLOW_DATA_DEDUPE_INTERVAL) as working hours rarely change
 * - Working hours are stored per organisation in the user profile
 */
export const useGetPlannedWorkingHoursByDate = (date: string) => {
  const { data } = useGetUserProfile({
    swr: {
      enabled: !!date,
      revalidateOnFocus: false,
      dedupingInterval: UI_SLOW_DATA_DEDUPE_INTERVAL,
    },
  })

  const lastSelectedOrganisationId =
    data?.settings.lastSelectedOrganisation?.id ||
    data?.organisations.filter((item) => item.private)[0].organisationReference.id

  const filteredWeeks = data?.organisations.filter(
    (org) => org.organisationReference.id === lastSelectedOrganisationId,
  )

  const week =
    Array.isArray(filteredWeeks) && filteredWeeks[0]?.plannedWorkingHours
      ? filteredWeeks[0].plannedWorkingHours
      : plannedWorkingHoursStub

  const plannedHoursDay = { ...plannedWorkingHoursStub, ...week }[
    getWorkingHoursWeekdayString(date)
  ]

  const allOrganisationsByDay = { ...plannedWorkingHoursStub }
  data?.organisations.forEach((item) => {
    const { plannedWorkingHours } = item
    if (plannedWorkingHours) {
      Object.keys(plannedWorkingHours).forEach((day) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        allOrganisationsByDay[day] += plannedWorkingHours[day]
      })
    }
  })

  const plannedHoursWeek = Object.entries({ ...plannedWorkingHoursStub, ...week }).reduce(
    (acc, [_key, value]) => ['total', acc[1] + value],
  )[1]

  return { plannedHoursWeek, plannedHoursDay, allOrganisationsByDay }
}
