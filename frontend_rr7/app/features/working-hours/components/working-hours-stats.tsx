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

import { useTranslation } from 'react-i18next'

import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { StatsGroup } from '~/features/stats/components/stats-group'
import { StatsTileHours } from '~/features/stats/components/stats-tile-hours'
import { useGetWeeklyPlannedWorkingHoursAggregate } from '~/features/working-hours/hooks/use-get-weekly-planned-working-hours-aggregate'
import { plannedWorkingHoursStub } from '~/lib/utils/date/stub-planned-working-hours'

export const WorkingHoursStats = () => {
  const { t } = useTranslation('common')
  const { organisations } = useOrganisation()
  const { allOrganisationsWorkingHours } =
    useGetWeeklyPlannedWorkingHoursAggregate()

  const totalHoursPerWeek = Object.values(allOrganisationsWorkingHours).reduce(
    (sum, h) => sum + h,
    0,
  )

  const orgHours =
    organisations?.map((org) => {
      const hours = org.plannedWorkingHours ?? plannedWorkingHoursStub
      const total = Object.values(hours).reduce((sum, h) => sum + h, 0)
      return {
        hours: total,
        name: org.private
          ? t('organisation:myPersonalOrganisation', {
              defaultValue: 'My personal organisation',
            })
          : org.organisationReference.key,
      }
    }) ?? []

  return (
    <div className="bg-base-200 p-4">
      <StatsGroup>
        {orgHours.map((org) => (
          <StatsTileHours
            key={org.name}
            label={org.name}
            standalone={false}
            value={org.hours}
          />
        ))}
        <StatsTileHours
          label={t('working-hours:totalPerWeek', {
            defaultValue: 'Total per week',
          })}
          standalone={false}
          value={totalHoursPerWeek}
        />
      </StatsGroup>
    </div>
  )
}
