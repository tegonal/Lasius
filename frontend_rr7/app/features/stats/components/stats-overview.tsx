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

import { StatsGroup } from './stats-group'
import { StatsTileHours } from './stats-tile-hours'
import { StatsTileNumber } from './stats-tile-number'

type StatsOverviewProps = {
  distinctProjects: number
  distinctUsers: number
  elements: number
  hours: number
}

export const StatsOverview = ({
  distinctProjects,
  distinctUsers,
  elements,
  hours,
}: StatsOverviewProps) => {
  const { t } = useTranslation()

  const hasData = elements > 0

  if (!hasData) {
    return null
  }

  return (
    <StatsGroup className="flex gap-4">
      <StatsTileHours
        label={t('units.hours', 'Hours')}
        standalone={false}
        value={hours}
      />
      <StatsTileNumber
        label={t('bookings:title', 'Bookings')}
        standalone={false}
        value={elements}
      />
      {distinctUsers > 1 && (
        <StatsTileNumber
          label={t('users.title', 'Users')}
          standalone={false}
          value={distinctUsers}
        />
      )}
      {distinctProjects > 1 && (
        <StatsTileNumber
          label={t('projects:title', 'Projects')}
          standalone={false}
          value={distinctProjects}
        />
      )}
    </StatsGroup>
  )
}
