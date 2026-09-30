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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AnimateNumber } from '~/components/ui/animations/animate-number'
import { decimalHoursToObject } from '~/lib/utils/dates'
import { useShouldShowStatsTileTimeAsDecimals, useUIStore } from '~/stores/ui-store'

import { StatsTileWrapper } from './stats-tile-wrapper'

type Properties = {
  label: string
  standalone?: boolean
  value: number
}

export const StatsTileHours = ({ label, standalone = true, value }: Properties) => {
  const { t } = useTranslation()

  const isShowDecimalHours = useShouldShowStatsTileTimeAsDecimals()
  const toggleStatsTileTimeAsDecimals = useUIStore((state) => state.toggleStatsTileTimeAsDecimals)

  const duration = decimalHoursToObject(value)

  // A new value animates from the previous value.
  // A new display format mounts new numbers, and they start at the current value.
  const [animation, setAnimation] = useState({
    from: 0,
    isDecimal: isShowDecimalHours,
    to: value,
  })
  if (!Object.is(animation.to, value)) {
    setAnimation({ from: animation.to, isDecimal: isShowDecimalHours, to: value })
  } else if (animation.isDecimal !== isShowDecimalHours) {
    setAnimation({ from: value, isDecimal: isShowDecimalHours, to: value })
  }
  const fromDuration = decimalHoursToObject(animation.from)

  return (
    <StatsTileWrapper standalone={standalone}>
      <div
        className="stat hover:bg-base-200 h-fit cursor-pointer transition-colors select-none"
        onClick={toggleStatsTileTimeAsDecimals}>
        <div className="stat-title">{label}</div>
        <div className="stat-value text-2xl">
          {isShowDecimalHours ? (
            <AnimateNumber from={round(animation.from, 2)} to={round(value, 2)} />
          ) : (
            <>
              <AnimateNumber from={fromDuration.hours} leftpad={1} to={duration.hours} />
              :
              <AnimateNumber from={fromDuration.minutes} leftpad={1} to={duration.minutes} />
            </>
          )}
        </div>
        <div className="stat-desc">
          {isShowDecimalHours
            ? t('stats:decimalHours', 'Decimal hours')
            : t('stats:hoursMinutes', 'HH:MM')}
        </div>
      </div>
    </StatsTileWrapper>
  )
}
