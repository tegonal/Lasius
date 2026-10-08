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

import {
  ResponsiveStream,
  type StackTooltipProps,
  type StreamSliceData,
  type TooltipProps,
} from '@nivo/stream'
import { format } from 'date-fns'
import { type Locale } from 'date-fns/locale'
import { round, sumBy } from 'es-toolkit'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ChartStackTooltip,
  TooltipContainer,
  TooltipItem,
} from '~/components/ui/charts/chart-tooltips'
import { nivoTheme, useNivoColors } from '~/components/ui/charts/nivo-theme'
import { EmptyStateStats } from '~/features/stats/components/empty-state-stats'
import {
  type MonthlyWeekStreamData,
  prepareMonthStreamData,
} from '~/features/stats/lib/month-stream-data'
import { getDateLocale } from '~/lib/utils/date-locale'

// ─── Types ───────────────────────────────────────────────────────────────────

export type { MonthlyWeekStreamData } from '~/features/stats/lib/month-stream-data'
export type MonthlyWeekStreamKeys = string[]

// Generate translated weekday labels using date-fns
const getWeekdayLabels = (dateLocale: Locale) => {
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
}

// Nivo renders this tooltip with its own props only, so it reads the locale itself.
const MonthStackTooltip = ({ slice }: StackTooltipProps) => {
  const { i18n } = useTranslation('common')
  const weekDays = getWeekdayLabels(getDateLocale(i18n.language))

  return (
    <ChartStackTooltip
      formatLabel={(id) => id || ''}
      formatValue={(value) => `${value}h`}
      getTitle={(index) => {
        const weekDay = index === undefined ? undefined : weekDays[index]
        return weekDay || `Day ${(index || 0) + 1}`
      }}
      slice={toStackTooltipSlice(slice)}
    />
  )
}

// ChartStackTooltip expects string layer ids. Nivo types a layer id as a string or a number.
const toStackTooltipSlice = (slice: StreamSliceData) => ({
  index: slice.index,
  stack: slice.stack.map((datum) => ({
    color: datum.color,
    layerId: String(datum.layerId),
    layerLabel: String(datum.layerLabel),
    value: datum.value,
  })),
})

// Nivo passes the hovered layer, not a point. The tooltip shows the total hours of that layer.
const MonthLayerTooltip = ({ layer }: TooltipProps) => (
  <TooltipContainer>
    <TooltipItem
      color={layer.color}
      label={String(layer.label)}
      value={`${round(
        sumBy(layer.data, (datum) => datum.value),
        2,
      )}h`}
    />
  </TooltipContainer>
)

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

  const weekDays = useMemo(() => getWeekdayLabels(dateLocale), [dateLocale])

  const prepared = prepareMonthStreamData(data, keys)
  if (!prepared) {
    return (
      <div className="h-64 w-full">
        <EmptyStateStats />
      </div>
    )
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
            data={prepared.data}
            enableGridX={false}
            enableGridY={true}
            enableStackTooltip={true}
            fillOpacity={0.85}
            isInteractive={true}
            keys={prepared.keys}
            margin={{ bottom: 30, left: 10, right: 10, top: 0 }}
            motionConfig="stiff"
            offsetType="silhouette"
            stackTooltip={MonthStackTooltip}
            theme={MONTH_STREAM_THEME}
            tooltip={MonthLayerTooltip}
          />
        </div>
      </div>
    </div>
  )
}

// The stream chart takes only these blocks of the shared theme. The other keys of nivoTheme would change the rendered chart.
const MONTH_STREAM_THEME = {
  axis: nivoTheme.axis,
  grid: nivoTheme.grid,
  text: {
    fill: 'var(--color-base-content)',
    fillOpacity: 0.8,
    fontSize: 14, // text-sm equivalent
  },
  tooltip: { container: nivoTheme.tooltip.container },
}
