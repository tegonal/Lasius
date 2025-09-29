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

import { WorkingHoursSummary } from 'components/features/user/workingHours/week/workingHoursSummary'
import { WorkingHoursWeek } from 'components/features/user/workingHours/week/workingHoursWeek'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormElement } from 'components/ui/forms/FormElement'
import { useGetWeeklyPlannedWorkingHoursAggregate } from 'lib/api/hooks/useGetWeeklyPlannedWorkingHoursAggregate'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import React from 'react'
import { useIsClient } from 'usehooks-ts'

export const WorkingHoursForm: React.FC = () => {
  const { organisations } = useOrganisation()
  const { allOrganisationsWorkingHours } = useGetWeeklyPlannedWorkingHoursAggregate()
  const isClient = useIsClient()

  if (!isClient) return null

  return (
    <>
      <div className="mb-3 w-full">
        <FieldSet>
          <FormElement>
            <WorkingHoursSummary aggregatedPlannedWorkingHours={allOrganisationsWorkingHours} />
          </FormElement>
        </FieldSet>
      </div>
      {organisations?.map((org) => (
        <div key={org.organisationReference.id} className="mb-3 w-full">
          <FieldSet>
            <FormElement>
              <WorkingHoursWeek organisation={org} />
            </FormElement>
          </FieldSet>
        </div>
      ))}
    </>
  )
}
