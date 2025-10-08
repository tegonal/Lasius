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

import { StatsTileWrapper } from 'components/ui/data-display/StatsTileWrapper'
import { cn } from 'lib/utils/cn'
import React from 'react'

type Props = {
  value: number
  label: string
  standalone?: boolean
  period?: 'month' | 'week' | 'day'
}

export const StatsTilePercentage: React.FC<Props> = ({
  value,
  label: _label,
  standalone = true,
  period,
}) => {
  const roundedValue = Math.round(value)
  const displayValue = roundedValue > 999 ? '999+' : roundedValue.toString()

  // Determine color based on percentage
  const getProgressColor = () => {
    if (roundedValue >= 100) return 'text-success'
    if (roundedValue >= 75) return 'text-info'
    if (roundedValue >= 50) return 'text-warning'
    return 'text-base-content/60'
  }

  const getPeriodText = () => {
    switch (period) {
      case 'month':
        return 'of this month'
      case 'week':
        return 'of this week'
      case 'day':
        return 'of this day'
      default:
        return ''
    }
  }

  return (
    <StatsTileWrapper standalone={standalone}>
      <div className="stat h-fit">
        <div className="stat-value flex flex-col items-center py-2">
          <div
            className={cn('radial-progress', getProgressColor())}
            style={
              { '--value': Math.min(roundedValue, 100), '--size': '4rem' } as React.CSSProperties
            }
            role="progressbar">
            <span className="text-sm font-bold">{displayValue}%</span>
          </div>
          {period && <div className="text-base-content/60 mt-2 text-xs">{getPeriodText()}</div>}
        </div>
      </div>
    </StatsTileWrapper>
  )
}
