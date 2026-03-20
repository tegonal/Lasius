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
import { StatsTilePercentage } from 'components/ui/data-display/StatsTilePercentage'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  bookings: number
  hours: number
  expectedHours: number
  fulfilledPercentage: number
  period?: 'day' | 'week' | 'month'
}

export const StatsOverviewGrid = ({
  bookings,
  hours,
  expectedHours,
  fulfilledPercentage,
  period,
}: Props) => {
  const { t } = useTranslation('common')

  return (
    <div className="flex-1 space-y-3">
      <StatsGroup className="grid w-full grid-cols-2">
        <StatsTileNumber
          value={bookings}
          label={t('bookings.title', { defaultValue: 'Bookings' })}
          standalone={false}
        />
        <StatsTileHours
          value={hours}
          label={t('common.time.hours', { defaultValue: 'Hours' })}
          standalone={false}
        />
      </StatsGroup>
      <StatsGroup className="grid w-full grid-cols-2">
        <StatsTileHours
          value={expectedHours}
          label={t('statistics.expectedHours', { defaultValue: 'Expected hours' })}
          standalone={false}
        />
        <StatsTilePercentage
          value={fulfilledPercentage}
          label={t('statistics.percentOfPlannedHours', {
            defaultValue: '% of planned hours',
          })}
          standalone={false}
          period={period}
        />
      </StatsGroup>
    </div>
  )
}
