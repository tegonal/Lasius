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

import { StatsGroup } from '~/features/stats/components/stats-group'
import { StatsTileHours } from '~/features/stats/components/stats-tile-hours'
import { StatsTileNumber } from '~/features/stats/components/stats-tile-number'

type Props = {
  bookings: number
  hours: number
  projects?: number
  users?: number
}

export const BookingHistoryStats = ({
  bookings,
  hours,
  projects,
  users,
}: Props) => {
  const { t } = useTranslation('common')

  return (
    <StatsGroup className="flex gap-4">
      <StatsTileHours
        label={t('common.units.hours', { defaultValue: 'Hours' })}
        standalone={false}
        value={hours}
      />
      <StatsTileNumber
        label={t('bookings.title', { defaultValue: 'Bookings' })}
        standalone={false}
        value={bookings}
      />
      {users !== undefined && users > 1 && (
        <StatsTileNumber
          label={t('users.title', { defaultValue: 'Users' })}
          standalone={false}
          value={users}
        />
      )}
      {projects !== undefined && projects > 1 && (
        <StatsTileNumber
          label={t('projects.title', { defaultValue: 'Projects' })}
          standalone={false}
          value={projects}
        />
      )}
    </StatsGroup>
  )
}
