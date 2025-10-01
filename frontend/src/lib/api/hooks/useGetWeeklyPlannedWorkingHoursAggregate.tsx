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

import { ModelsWorkingHours } from 'lib/api/lasius'
import { useGetUserProfile } from 'lib/api/lasius/user/user'
import { plannedWorkingHoursStub } from 'lib/utils/date/stubPlannedWorkingHours'
import { UI_SLOW_DATA_DEDUPE_INTERVAL } from 'projectConfig/intervals'
import { useMemo } from 'react'

/**
 * Custom hook for aggregating planned working hours across organisations.
 * Provides working hour summaries for both the selected organisation and all organisations
 * the user belongs to, useful for users working across multiple organisations.
 *
 * @returns Object containing:
 *   - allOrganisationsWorkingHours: Working hours by weekday aggregated across all user organisations
 *   - selectedOrganisationWorkingHours: Working hours by weekday for the currently selected organisation
 *   - selectedOrganisationWorkingHoursTotal: Total weekly hours for the selected organisation
 *
 * @example
 * const { selectedOrganisationWorkingHoursTotal, allOrganisationsWorkingHours } = useGetWeeklyPlannedWorkingHoursAggregate()
 *
 * console.log(`Total weekly hours: ${selectedOrganisationWorkingHoursTotal}`)
 * console.log(`Monday hours across all orgs: ${allOrganisationsWorkingHours.monday}`)
 *
 * @remarks
 * - Falls back to plannedWorkingHoursStub if no working hours are configured
 * - Aggregates hours additively (e.g., 8h in Org A + 4h in Org B = 12h total)
 * - Uses the last selected organisation from user settings for single-org data
 * - Uses slow revalidation (UI_SLOW_DATA_DEDUPE_INTERVAL) as working hours rarely change
 * - Efficiently memoized to prevent unnecessary recalculations
 * - Useful for comparing workload across organisations or displaying total expected hours
 */
export const useGetWeeklyPlannedWorkingHoursAggregate = () => {
  const { data } = useGetUserProfile({
    swr: {
      revalidateOnFocus: false,
      dedupingInterval: UI_SLOW_DATA_DEDUPE_INTERVAL,
    },
  })

  const allOrganisationsWorkingHours = useMemo(() => {
    const allOrganisations: ModelsWorkingHours = { ...plannedWorkingHoursStub }
    data?.organisations.forEach((item) => {
      const { plannedWorkingHours } = item
      if (plannedWorkingHours) {
        Object.keys(plannedWorkingHours).forEach((day: any) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          allOrganisations[day] += plannedWorkingHours[day]
        })
      }
    })
    return allOrganisations
  }, [data])

  const selectedOrganisationWorkingHours = useMemo(() => {
    if (data && data.organisations && data.organisations.length > 0) {
      const workingHours = data.organisations.find(
        (org) => org.organisationReference.id === data?.settings?.lastSelectedOrganisation?.id,
      )
      return workingHours ? workingHours.plannedWorkingHours : plannedWorkingHoursStub
    }
    return plannedWorkingHoursStub
  }, [data])

  const selectedOrganisationWorkingHoursTotal = useMemo(
    () =>
      Object.entries(selectedOrganisationWorkingHours).reduce((a, c) => ['total', a[1] + c[1]])[1],
    [selectedOrganisationWorkingHours],
  )

  return {
    allOrganisationsWorkingHours,
    selectedOrganisationWorkingHours,
    selectedOrganisationWorkingHoursTotal,
  }
}
