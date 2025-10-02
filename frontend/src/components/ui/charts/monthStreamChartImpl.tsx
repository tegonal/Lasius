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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { ResponsiveStream } from '@nivo/stream'
import { format } from 'date-fns'
import { logger } from 'lib/logger'
import {
  isValidMonthlyWeekStreamData,
  MonthlyWeekStreamData,
  MonthlyWeekStreamKeys,
} from 'lib/schemas/chartSchemas'
import { getDateLocale } from 'lib/utils/date/dateFormat'
import { useTranslation } from 'next-i18next'
import React from 'react'

import { ChartSingleTooltip, ChartStackTooltip } from './shared/chartTooltips'
import { useNivoColors } from './shared/getConsistentColor'

type Props = {
  data: MonthlyWeekStreamData
  keys: MonthlyWeekStreamKeys
}

export const MonthStreamChartImpl: React.FC<Props> = ({ data, keys }) => {
  const { t, i18n } = useTranslation('common')
  const nivoColors = useNivoColors()

  // Get the correct locale for date-fns from centralized config
  const dateLocale = getDateLocale(i18n.language)

  // Generate translated weekday labels using date-fns
  const weekDays = React.useMemo(() => {
    // Create dates for each weekday (Monday = 0, Sunday = 6 in our array)
    const dates = [
      new Date(2025, 0, 6), // Monday
      new Date(2025, 0, 7), // Tuesday
      new Date(2025, 0, 8), // Wednesday
      new Date(2025, 0, 9), // Thursday
      new Date(2025, 0, 10), // Friday
      new Date(2025, 0, 11), // Saturday
      new Date(2025, 0, 12), // Sunday
    ]
    return dates.map((date) => format(date, 'EEE', { locale: dateLocale }))
  }, [dateLocale])

  // Validate data structure using type guard
  if (!isValidMonthlyWeekStreamData(data)) {
    logger.error('[MonthStreamChartImpl] Invalid monthly week stream data structure:', {
      data,
      keys,
    })
    return (
      <div className="bg-base-200 flex h-64 w-full items-center justify-center rounded-lg p-4">
        <div className="text-base-content/60 text-sm">
          {t('charts.errors.invalidData', { defaultValue: 'Invalid data' })}
        </div>
      </div>
    )
  }

  // Defensive checks
  if (!data || !keys || !Array.isArray(data) || !Array.isArray(keys) || data.length !== 7) {
    logger.error('[MonthStreamChartImpl] Invalid data or keys:', { data, keys })
    return (
      <div className="bg-base-200 flex h-64 w-full items-center justify-center rounded-lg p-4">
        <div className="text-base-content/60 text-sm">
          {t('charts.errors.invalidData', { defaultValue: 'Invalid data' })}
        </div>
      </div>
    )
  }

  // Check if we have any actual data - but still need valid keys
  const hasData = keys.length > 0 && data.some((d) => keys.some((key) => (d[key] as number) > 0))

  // If no keys, provide at least one dummy key to avoid null issues
  const safeKeys = keys.length > 0 ? keys : ['Week 1']

  if (!hasData) {
    return (
      <div className="bg-base-200 flex h-64 w-full items-center justify-center rounded-lg p-4">
        <div className="text-base-content/60 text-sm">
          {t('charts.noData.month', { defaultValue: 'No booking data for this month' })}
        </div>
      </div>
    )
  }

  // Prepare data for Nivo - ensure all keys exist in all objects
  const safeData = data.map((item) => {
    const safeItem: any = {}

    // Add all week keys with their values
    safeKeys.forEach((key) => {
      const value = item[key]
      safeItem[key] = !isNaN(value) ? value : 0
    })

    return safeItem
  })

  // Theme using DaisyUI CSS variables for proper dark/light mode support
  const theme = {
    text: {
      fill: 'var(--color-base-content)',
      fillOpacity: 0.8,
      fontSize: 14, // text-sm equivalent
    },
    axis: {
      domain: {
        line: {
          stroke: 'var(--color-base-content)',
          strokeWidth: 1,
          strokeOpacity: 0.3,
        },
      },
      ticks: {
        line: {
          stroke: 'var(--color-base-content)',
          strokeWidth: 1,
          strokeOpacity: 0.2,
        },
        text: {
          fill: 'var(--color-base-content)',
          fillOpacity: 0.8,
          fontSize: 14, // text-sm equivalent
        },
      },
      legend: {
        text: {
          fill: 'var(--color-base-content)',
          fillOpacity: 0.9,
          fontSize: 14, // text-sm equivalent
          fontWeight: 500,
        },
      },
    },
    grid: {
      line: {
        stroke: 'var(--color-base-content)',
        strokeWidth: 1,
        strokeOpacity: 0.1,
      },
    },
    tooltip: {
      container: {
        background: 'var(--color-base-200)',
        color: 'var(--color-base-content)',
        fontSize: 14, // text-sm equivalent
        borderRadius: 'var(--rounded-box, 0.5rem)',
        padding: '8px 12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        border: '1px solid var(--color-base-content)',
        borderOpacity: 0.1,
      },
    },
  }

  return (
    <div className="bg-base-200 rounded-lg p-4">
      <div className="flex gap-4">
        {/* Chart container */}
        <div className="h-64 flex-1">
          <ResponsiveStream
            data={safeData}
            keys={safeKeys}
            margin={{ top: 0, right: 10, bottom: 30, left: 10 }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              format: (value) => weekDays[value] || value,
            }}
            axisLeft={null}
            enableGridX={false}
            enableGridY={true}
            offsetType="silhouette"
            colors={nivoColors}
            fillOpacity={0.85}
            borderWidth={0}
            animate={false}
            motionConfig="stiff"
            isInteractive={true}
            enableStackTooltip={true}
            theme={theme}
            stackTooltip={({ slice }) => (
              <ChartStackTooltip
                slice={slice}
                getTitle={(index) =>
                  index !== undefined && weekDays[index]
                    ? weekDays[index]
                    : `Day ${(index || 0) + 1}`
                }
                formatValue={(value) => `${value}h`}
                formatLabel={(id) => id || ''}
              />
            )}
            tooltip={({ point }) => (
              <ChartSingleTooltip point={point} formatValue={(value) => `${value}h`} />
            )}
          />
        </div>
      </div>
    </div>
  )
}
