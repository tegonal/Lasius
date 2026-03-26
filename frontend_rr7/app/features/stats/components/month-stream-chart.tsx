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

// @ts-nocheck

import { ResponsiveStream } from '@nivo/stream'
import { format } from 'date-fns'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ChartSingleTooltip,
  ChartStackTooltip,
} from '~/components/ui/charts/chart-tooltips'
import { useNivoColors } from '~/components/ui/charts/nivo-theme'
import { EmptyStateStats } from '~/features/stats/components/empty-state-stats'
import { getDateLocale } from '~/lib/utils/date-locale'

// ─── Types ───────────────────────────────────────────────────────────────────

export type MonthlyWeekStreamData = MonthlyWeekStreamDataItem[]
export type MonthlyWeekStreamDataItem = Record<string, number>
export type MonthlyWeekStreamKeys = string[]

export const MonthStreamChart = ({
  data,
  keys,
}: {
  data: MonthlyWeekStreamData
  keys: MonthlyWeekStreamKeys
}) => {
  const { i18n } = useTranslation('common')
  const nivoColors = useNivoColors()

  // Get the correct locale for date-fns from centralized config
  const dateLocale = getDateLocale(i18n.language)

  // Generate translated weekday labels using date-fns
  const weekDays = useMemo(() => {
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
    return (
      <div className="h-64 w-full">
        <EmptyStateStats />
      </div>
    )
  }

  // Defensive checks
  if (
    !data ||
    !keys ||
    !Array.isArray(data) ||
    !Array.isArray(keys) ||
    data.length !== 7
  ) {
    return (
      <div className="h-64 w-full">
        <EmptyStateStats />
      </div>
    )
  }

  // Check if we have any actual data - but still need valid keys
  const hasData =
    keys.length > 0 &&
    data.some((d) => keys.some((key) => (d[key] as number) > 0))

  // If no keys, provide at least one dummy key to avoid null issues
  const safeKeys = keys.length > 0 ? keys : ['Week 1']

  if (!hasData) {
    return (
      <div className="h-64 w-full">
        <EmptyStateStats />
      </div>
    )
  }

  // Prepare data for Nivo - ensure all keys exist in all objects
  const safeData = data.map((item) => {
    const safeItem: any = {}

    // Add all week keys with their values
    for (const key of safeKeys) {
      const value = item[key]
      safeItem[key] = Number.isNaN(value) ? 0 : value
    }

    return safeItem
  })

  // Theme using DaisyUI CSS variables for proper dark/light mode support
  const theme = {
    axis: {
      domain: {
        line: {
          stroke: 'var(--color-base-content)',
          strokeOpacity: 0.3,
          strokeWidth: 1,
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
      ticks: {
        line: {
          stroke: 'var(--color-base-content)',
          strokeOpacity: 0.2,
          strokeWidth: 1,
        },
        text: {
          fill: 'var(--color-base-content)',
          fillOpacity: 0.8,
          fontSize: 14, // text-sm equivalent
        },
      },
    },
    grid: {
      line: {
        stroke: 'var(--color-base-content)',
        strokeOpacity: 0.1,
        strokeWidth: 1,
      },
    },
    text: {
      fill: 'var(--color-base-content)',
      fillOpacity: 0.8,
      fontSize: 14, // text-sm equivalent
    },
    tooltip: {
      container: {
        background: 'var(--color-base-200)',
        border: '1px solid var(--color-base-content)',
        borderOpacity: 0.1,
        borderRadius: 'var(--rounded-box, 0.5rem)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        color: 'var(--color-base-content)',
        fontSize: 14, // text-sm equivalent
        padding: '8px 12px',
      },
    },
  }

  return (
    <div className="bg-base-200 rounded-lg p-4">
      <div className="flex gap-4">
        {/* Chart container */}
        <div className="h-64 flex-1">
          <ResponsiveStream
            animate={false}
            axisBottom={{
              format: (value) => weekDays[value] || value,
              tickPadding: 5,
              tickRotation: 0,
              tickSize: 5,
            }}
            axisLeft={null}
            axisRight={null}
            axisTop={null}
            borderWidth={0}
            colors={nivoColors}
            data={safeData}
            enableGridX={false}
            enableGridY={true}
            enableStackTooltip={true}
            fillOpacity={0.85}
            isInteractive={true}
            keys={safeKeys}
            margin={{ bottom: 30, left: 10, right: 10, top: 0 }}
            motionConfig="stiff"
            offsetType="silhouette"
            stackTooltip={({ slice }) => (
              <ChartStackTooltip
                formatLabel={(id) => id || ''}
                formatValue={(value) => `${value}h`}
                getTitle={(index) =>
                  index !== undefined && weekDays[index]
                    ? weekDays[index]
                    : `Day ${(index || 0) + 1}`
                }
                slice={slice}
              />
            )}
            theme={theme}
            tooltip={({ point }) => (
              <ChartSingleTooltip
                formatValue={(value) => `${value}h`}
                point={point}
              />
            )}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Validation ──────────────────────────────────────────────────────────────

const isValidMonthlyWeekStreamData = (
  data: unknown,
): data is MonthlyWeekStreamData => {
  if (!Array.isArray(data) || data.length !== 7) return false
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      Object.values(item).every((v) => typeof v === 'number' && v >= 0),
  )
}
