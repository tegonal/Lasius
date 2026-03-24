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
import { Coffee, Smile, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { type BurnoutMetrics } from '~/lib/api/functions/compute-work-health-metrics.server'
import { decimalHoursToDurationString } from '~/lib/utils/duration'
import { useStatsTileTimeAsDecimals } from '~/stores/ui-store'

type Props = {
  burnoutMetrics: BurnoutMetrics | null
  plannedWeeklyHours: number
}

export const WorkloadIndicator = ({
  burnoutMetrics,
  plannedWeeklyHours,
}: Props) => {
  const { t } = useTranslation('dashboard')
  const showDecimalHours = useStatsTileTimeAsDecimals()

  if (!burnoutMetrics) {
    return null
  }

  // Only show healthy message if at least 80% of planned hours are reached
  if (
    burnoutMetrics.level === 'healthy' &&
    burnoutMetrics.weeklyHours < plannedWeeklyHours * 0.8
  ) {
    return null
  }

  const formatHours = (value: number) =>
    showDecimalHours
      ? round(value, 2).toString()
      : decimalHoursToDurationString(value)

  const hoursText = `${formatHours(burnoutMetrics.weeklyHours)}/${formatHours(burnoutMetrics.plannedHours)}`

  const getIcon = () => {
    if (burnoutMetrics.level === 'healthy') return Smile
    if (burnoutMetrics.level === 'risk') return Coffee
    return Zap
  }

  const getColor = () => {
    if (burnoutMetrics.level === 'healthy') return 'text-success'
    if (burnoutMetrics.level === 'risk') return 'text-error'
    return 'text-warning'
  }

  const getBgColor = () => {
    if (burnoutMetrics.level === 'healthy') return 'bg-success/10'
    if (burnoutMetrics.level === 'risk') return 'bg-error/10'
    return 'bg-warning/10'
  }

  const getMessage = () => {
    if (burnoutMetrics.level === 'healthy') {
      return t('dashboard:workHealth.healthyLoad', 'Looking good!')
    }
    if (burnoutMetrics.level === 'risk') {
      return t('dashboard:workHealth.highLoad', 'Heavy load detected')
    }
    return t('dashboard:workHealth.elevatedLoad', 'Load is elevated')
  }

  const getReminder = () => {
    if (burnoutMetrics.level === 'risk') {
      return t(
        'dashboard:workHealth.relaxReminder',
        'Time to relax a little bit',
      )
    }
    return t('dashboard:workHealth.takeItEasy', 'Consider taking it easy')
  }

  const Icon = getIcon()

  return (
    <div
      className={`${getBgColor()} rounded-lg p-4 transition-all duration-300 hover:shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <div className={`${getColor()} flex-shrink-0`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{getMessage()}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm opacity-80">
            <span>
              <strong>{hoursText}</strong>{' '}
              {t('dashboard:workHealth.thisWeek', 'this week')}
            </span>
            {burnoutMetrics.consecutiveDays >= 6 && (
              <span>
                <strong>{burnoutMetrics.consecutiveDays}</strong>{' '}
                {t('dashboard:workHealth.consecutiveDays', 'consecutive days')}
              </span>
            )}
            {burnoutMetrics.averageDailyHours >= 9 && (
              <span>
                <strong>{burnoutMetrics.averageDailyHours.toFixed(1)}h</strong>{' '}
                {t('dashboard:workHealth.avgPerDay', 'avg/day')}
              </span>
            )}
          </div>
          {burnoutMetrics.level !== 'healthy' && (
            <p className="mt-2 text-sm opacity-70">{getReminder()}</p>
          )}
        </div>
      </div>
    </div>
  )
}
