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
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { AnimateNumber } from '~/components/ui/animations/animate-number'
import { decimalHoursToObject } from '~/lib/utils/dates'
import { useStatsTileTimeAsDecimals, useUIStore } from '~/stores/ui-store'

import { StatsTileWrapper } from './stats-tile-wrapper'

type Props = {
  label: string
  standalone?: boolean
  value: number
}

export const StatsTileHours = ({ label, standalone = true, value }: Props) => {
  const { t } = useTranslation()
  const previousValue = useRef<number>(0)
  const previousHours = useRef<number>(0)
  const previousMinutes = useRef<number>(0)

  const showDecimalHours = useStatsTileTimeAsDecimals()
  const toggleStatsTileTimeAsDecimals = useUIStore(
    (state) => state.toggleStatsTileTimeAsDecimals,
  )

  const duration = decimalHoursToObject(value)

  useEffect(() => {
    previousValue.current = value
    previousHours.current = duration.hours
    previousMinutes.current = duration.minutes
  }, [value, duration.hours, duration.minutes])

  return (
    <StatsTileWrapper standalone={standalone}>
      <div
        className="stat hover:bg-base-200 h-fit cursor-pointer transition-colors select-none"
        onClick={toggleStatsTileTimeAsDecimals}
      >
        <div className="stat-title">{label}</div>
        <div className="stat-value text-2xl">
          {showDecimalHours ? (
            <AnimateNumber
              from={round(previousValue.current, 2)}
              to={round(value, 2)}
            />
          ) : (
            <>
              <AnimateNumber
                from={previousHours.current}
                leftpad={1}
                to={duration.hours}
              />
              :
              <AnimateNumber
                from={previousMinutes.current}
                leftpad={1}
                to={duration.minutes}
              />
            </>
          )}
        </div>
        <div className="stat-desc">
          {showDecimalHours
            ? t('stats:decimalHours', 'Decimal hours')
            : t('stats:hoursMinutes', 'HH:MM')}
        </div>
      </div>
    </StatsTileWrapper>
  )
}
