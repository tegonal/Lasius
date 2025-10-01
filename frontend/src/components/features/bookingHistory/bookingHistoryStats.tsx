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
import { StatsTileNumber } from 'components/ui/data-display/StatsTileNumber'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  hours: number
  bookings: number
  users?: number
  projects?: number
}

export const BookingHistoryStats: React.FC<Props> = ({ hours, bookings, users, projects }) => {
  const { t } = useTranslation('common')
  return (
    <StatsGroup className="flex gap-4">
      <StatsTileHours
        value={hours}
        label={t('common.units.hours', { defaultValue: 'Hours' })}
        standalone={false}
      />
      <StatsTileNumber
        value={bookings}
        label={t('bookings.title', { defaultValue: 'Bookings' })}
        standalone={false}
      />
      {users !== undefined && users > 1 && (
        <StatsTileNumber
          value={users}
          label={t('users.title', { defaultValue: 'Users' })}
          standalone={false}
        />
      )}
      {projects !== undefined && projects > 1 && (
        <StatsTileNumber
          value={projects}
          label={t('projects.title', { defaultValue: 'Projects' })}
          standalone={false}
        />
      )}
    </StatsGroup>
  )
}
