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

import { round } from 'es-toolkit'
import { useTranslation } from 'react-i18next'

import { decimalHoursToDurationString } from '~/lib/utils/duration'
import { useStatsTileTimeAsDecimals, useUIStore } from '~/stores/ui-store'

type Props = {
  bookings: number
  expectedHours: number
  fulfilledPercentage: number
  hours: number
  period?: 'day' | 'month' | 'week'
}

export const StatsOverviewGrid = ({
  bookings,
  expectedHours,
  fulfilledPercentage,
  hours,
}: Props) => {
  const { t } = useTranslation('common')
  const showDecimalHours = useStatsTileTimeAsDecimals()
  const toggleStatsTileTimeAsDecimals = useUIStore(
    (state) => state.toggleStatsTileTimeAsDecimals,
  )

  const formatHours = (value: number) =>
    showDecimalHours
      ? round(value, 2).toString()
      : decimalHoursToDurationString(value)

  const hoursLabel = showDecimalHours
    ? t('stats.decimalHours', { defaultValue: 'Decimal hours' })
    : t('common.time.hours', { defaultValue: 'Hours' })

  return (
    <div className="flex-1 space-y-3">
      <div className="stats grid w-full grid-cols-2">
        <div className="stat">
          <div className="stat-title">
            {t('bookings.title', { defaultValue: 'Bookings' })}
          </div>
          <div className="stat-value">{bookings}</div>
        </div>
        <div
          className="stat hover:bg-base-200 cursor-pointer transition-colors"
          onClick={toggleStatsTileTimeAsDecimals}
        >
          <div className="stat-title">{hoursLabel}</div>
          <div className="stat-value">{formatHours(hours)}</div>
        </div>
      </div>
      <div className="stats grid w-full grid-cols-2">
        <div
          className="stat hover:bg-base-200 cursor-pointer transition-colors"
          onClick={toggleStatsTileTimeAsDecimals}
        >
          <div className="stat-title">
            {t('statistics.expectedHours', {
              defaultValue: 'Expected hours',
            })}
          </div>
          <div className="stat-value">{formatHours(expectedHours)}</div>
        </div>
        <div className="stat">
          <div className="stat-title">
            {t('statistics.percentOfPlannedHours', {
              defaultValue: '% of planned hours',
            })}
          </div>
          <div className="stat-value">{fulfilledPercentage.toFixed(0)}%</div>
        </div>
      </div>
    </div>
  )
}
