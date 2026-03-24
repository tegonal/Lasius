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

import { useMemo } from 'react'

import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { plannedWorkingHoursStub } from '~/lib/utils/date/stub-planned-working-hours'
import { type ModelsWorkingHours } from '~/services/api/lasius/modelsWorkingHours'

/**
 * Aggregates planned working hours across all user organisations.
 * Returns the combined hours per weekday and per selected organisation.
 */
export const useGetWeeklyPlannedWorkingHoursAggregate = () => {
  const { organisations, selectedOrganisation } = useOrganisation()

  const allOrganisationsWorkingHours = useMemo(() => {
    const aggregate: ModelsWorkingHours = { ...plannedWorkingHoursStub }
    for (const org of organisations) {
      const hours = org.plannedWorkingHours ?? plannedWorkingHoursStub
      for (const key of Object.keys(
        aggregate,
      ) as (keyof ModelsWorkingHours)[]) {
        aggregate[key] += hours[key]
      }
    }
    return aggregate
  }, [organisations])

  const selectedOrganisationWorkingHours = useMemo(
    () => selectedOrganisation?.plannedWorkingHours ?? plannedWorkingHoursStub,
    [selectedOrganisation],
  )

  const selectedOrganisationWorkingHoursTotal = useMemo(
    () =>
      Object.values(selectedOrganisationWorkingHours).reduce(
        (sum, h) => sum + h,
        0,
      ),
    [selectedOrganisationWorkingHours],
  )

  return {
    allOrganisationsWorkingHours,
    selectedOrganisationWorkingHours,
    selectedOrganisationWorkingHoursTotal,
  }
}
