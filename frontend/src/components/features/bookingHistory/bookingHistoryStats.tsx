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

import { Heading } from 'components/primitives/typography/Heading'
import { StatsGroup } from 'components/ui/data-display/StatsGroup'
import { StatsTileHours } from 'components/ui/data-display/StatsTileHours'
import { StatsTileNumber } from 'components/ui/data-display/StatsTileNumber'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  hours: number
  bookings: number
}

export const BookingHistoryStats: React.FC<Props> = ({ hours, bookings }) => {
  const { t } = useTranslation('common')
  return (
    <div className="w-full">
      <Heading variant="section">
        {t('bookingHistory.stats.currentSelection', { defaultValue: 'Current selection' })}
      </Heading>
      <StatsGroup className="w-full pb-4">
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
      </StatsGroup>
    </div>
  )
}
