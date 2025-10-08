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

import { Alert } from 'components/ui/feedback/Alert'
import { useWorkHealthMetrics } from 'lib/api/hooks/useWorkHealthMetrics'
import { decimalHoursToDurationString } from 'lib/utils/date/dates'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  plannedWeeklyHours: number
  referenceDate?: string
}

/**
 * Displays a work load indicator based on recent work patterns
 * Shows alerts when work hours exceed normal thresholds in a playful, encouraging way
 */
export const BurnoutIndicator: React.FC<Props> = ({ plannedWeeklyHours, referenceDate }) => {
  const { t } = useTranslation('common')
  const { burnoutMetrics, isLoading } = useWorkHealthMetrics(plannedWeeklyHours, 12, referenceDate)

  if (isLoading || !burnoutMetrics) {
    return null
  }

  // Determine variant based on level
  const variant =
    burnoutMetrics.level === 'risk'
      ? 'error'
      : burnoutMetrics.level === 'warning'
        ? 'warning'
        : 'success'

  const hoursText = `${decimalHoursToDurationString(burnoutMetrics.weeklyHours)}/${decimalHoursToDurationString(burnoutMetrics.plannedHours)}`

  // Playful messages based on load level
  const getMessage = () => {
    if (burnoutMetrics.level === 'healthy') {
      return t('workHealth.healthyLoad', { defaultValue: 'Looking good!' })
    }
    if (burnoutMetrics.level === 'risk') {
      return t('workHealth.highLoad', { defaultValue: 'Heavy load detected' })
    }
    return t('workHealth.elevatedLoad', { defaultValue: 'Load is elevated' })
  }

  const getReminder = () => {
    if (burnoutMetrics.level === 'risk') {
      return t('workHealth.relaxReminder', {
        defaultValue: 'Time to relax a little bit',
      })
    }
    return t('workHealth.takeItEasy', {
      defaultValue: 'Consider taking it easy',
    })
  }

  return (
    <div className="w-full px-2 py-1">
      <Alert variant={variant} className="animate-[fadeIn_0.4s_ease-out]" hideIcon>
        <div className="flex-1">
          <h3 className="font-semibold">{getMessage()}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span>
              <strong>{hoursText}</strong> {t('workHealth.thisWeek', { defaultValue: 'this week' })}
            </span>
            {burnoutMetrics.consecutiveDays >= 6 && (
              <span>
                <strong>{burnoutMetrics.consecutiveDays}</strong>{' '}
                {t('workHealth.consecutiveDays', { defaultValue: 'consecutive days' })}
              </span>
            )}
            {burnoutMetrics.averageDailyHours >= 9 && (
              <span>
                <strong>{burnoutMetrics.averageDailyHours.toFixed(1)}h</strong>{' '}
                {t('workHealth.avgPerDay', { defaultValue: 'avg/day' })}
              </span>
            )}
          </div>
          {burnoutMetrics.level !== 'healthy' && (
            <p className="mt-2 text-sm opacity-90">{getReminder()}</p>
          )}
        </div>
      </Alert>
    </div>
  )
}
