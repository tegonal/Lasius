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

import { AnimateNumber } from 'components/ui/animations/motion/animateNumber'
import { StatsTileWrapper } from 'components/ui/data-display/StatsTileWrapper'
import { round } from 'es-toolkit'
import { decimalHoursToObject } from 'lib/utils/date/dates'
import React, { useEffect, useRef } from 'react'
import { useStatsTileTimeAsDecimals, useUIStore } from 'stores/uiStore'

type Props = {
  value: number
  label: string
  standalone?: boolean
}

export const StatsTileHours: React.FC<Props> = ({ value, label, standalone = true }) => {
  const previousValue = useRef<number>(0)
  const previousHours = useRef<number>(0)
  const previousMinutes = useRef<number>(0)

  const showDecimalHours = useStatsTileTimeAsDecimals()
  const toggleStatsTileTimeAsDecimals = useUIStore((state) => state.toggleStatsTileTimeAsDecimals)

  useEffect(() => {
    const duration = decimalHoursToObject(value)
    previousValue.current = value
    previousHours.current = duration.hours
    previousMinutes.current = duration.minutes
  }, [value])

  return (
    <StatsTileWrapper standalone={standalone}>
      <div
        className="stat hover:bg-base-200 h-fit cursor-pointer transition-colors select-none"
        onClick={toggleStatsTileTimeAsDecimals}>
        <div className="stat-title">{label}</div>
        <div className="stat-value text-2xl">
          {showDecimalHours ? (
            <AnimateNumber from={round(previousValue.current, 2)} to={round(value, 2)} />
          ) : (
            <>
              <AnimateNumber
                from={previousHours.current}
                to={decimalHoursToObject(value).hours}
                leftpad={1}
              />
              :
              <AnimateNumber
                from={previousMinutes.current}
                to={decimalHoursToObject(value).minutes}
                leftpad={1}
              />
            </>
          )}
        </div>
        <div className="stat-desc">{showDecimalHours ? 'Decimal hours' : 'HH:MM'}</div>
      </div>
    </StatsTileWrapper>
  )
}
