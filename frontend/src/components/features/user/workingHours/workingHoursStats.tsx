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

import { StatsGroup } from 'components/ui/data-display/StatsGroup'
import { StatsTileHours } from 'components/ui/data-display/StatsTileHours'
import { useGetWeeklyPlannedWorkingHoursAggregate } from 'lib/api/hooks/useGetWeeklyPlannedWorkingHoursAggregate'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { plannedWorkingHoursStub } from 'lib/utils/date/stubPlannedWorkingHours'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const WorkingHoursStats: React.FC = () => {
  const { t } = useTranslation('common')
  const { organisations } = useOrganisation()
  const { allOrganisationsWorkingHours } = useGetWeeklyPlannedWorkingHoursAggregate()

  // Calculate total hours per week
  const totalHoursPerWeek = Object.values(allOrganisationsWorkingHours).reduce(
    (sum, h) => sum + h,
    0,
  )

  // Calculate total hours per organisation
  const orgHours =
    organisations?.map((org) => {
      const hours = org.plannedWorkingHours || plannedWorkingHoursStub
      const total = Object.values(hours).reduce((sum, h) => sum + h, 0)
      return {
        name: org.private
          ? t('organisations.myPersonalOrganisation', {
              defaultValue: 'My personal organisation',
            })
          : org.organisationReference.key,
        hours: total,
      }
    }) || []

  return (
    <div className="bg-base-200 p-4">
      <StatsGroup>
        {orgHours.map((org) => (
          <StatsTileHours key={org.name} value={org.hours} label={org.name} standalone={false} />
        ))}
        <StatsTileHours
          value={totalHoursPerWeek}
          label={t('workingHours.totalPerWeek', { defaultValue: 'Total per week' })}
          standalone={false}
        />
      </StatsGroup>
    </div>
  )
}
