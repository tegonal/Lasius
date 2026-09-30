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
import { sumBy } from 'es-toolkit'
import { createContext, useContext } from 'react'

import {
  ChartStackTooltip,
  TooltipContainer,
  TooltipItem,
} from '~/components/ui/charts/chart-tooltips'
import { nivoTheme, useNivoColors } from '~/components/ui/charts/nivo-theme'
import { EmptyStateStats } from '~/features/stats/components/empty-state-stats'
import { type NivoChartDataType } from '~/lib/api/functions/get-nivo-chart-data-from-api-stats-data'

type Properties = {
  data: NivoChartDataType
  keys: string[]
}

// Nivo renders the stack tooltip with its own props only.
// The tooltip reads the chart data for the slice title from this context.
const StreamChartDataContext = createContext<NivoChartDataType>([])

const ProjectStackTooltip = ({ slice }: StackTooltipProps) => {
  const data = useContext(StreamChartDataContext)

  return (
    <ChartStackTooltip
      formatLabel={(id) => id || ''}
      formatValue={(value) => `${value.toFixed(1)}h`}
      getTitle={(index) => {
        const item = index === undefined ? undefined : data[index]
        return String(item?.category || index)
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
const ProjectLayerTooltip = ({ layer }: TooltipProps) => (
  <TooltipContainer>
    <TooltipItem
      color={layer.color}
      label={String(layer.label)}
      value={`${sumBy(layer.data, (datum) => datum.value).toFixed(1)}h`}
    />
  </TooltipContainer>
)

export const ProjectStreamChartImpl = ({ data, keys }: Properties) => {
  const nivoColors = useNivoColors()

  if (!data || !keys || !Array.isArray(data) || !Array.isArray(keys)) {
    return (
      <div className="h-80 w-full">
        <EmptyStateStats />
      </div>
    )
  }

  const hasData = keys.length > 0 && data.some((d) => keys.some((key) => Number(d[key] || 0) > 0))

  if (!hasData) {
    return (
      <div className="h-80 w-full">
        <EmptyStateStats />
      </div>
    )
  }

  const streamData = data.map((item) => {
    const transformed: Record<string, number> = {}
    for (const key of keys) {
      const value = item[key]
      transformed[key] = typeof value === 'number' ? value : 0
    }
    return transformed
  })

  return (
    <div className="bg-base-200 rounded-lg p-4">
      <div className="h-80 w-full">
        <StreamChartDataContext.Provider value={data}>
          <ResponsiveStream
            animate={false}
            axisBottom={{
              format: (value) => {
                const item = data[value]
                const category = item?.category || value
                return String(category)
              },
              tickPadding: 5,
              tickRotation: -45,
              tickSize: 5,
            }}
            axisLeft={null}
            axisRight={null}
            axisTop={null}
            borderWidth={0}
            colors={nivoColors}
            data={streamData}
            dotBorderColor={{ from: 'color', modifiers: [['darker', 0.7]] }}
            dotBorderWidth={2}
            dotColor={{ from: 'color' }}
            dotSize={8}
            enableDots={true}
            enableGridX={false}
            enableGridY={false}
            enableStackTooltip={true}
            fillOpacity={0.85}
            isInteractive={true}
            keys={keys}
            margin={{ bottom: 50, left: 20, right: 20, top: 20 }}
            motionConfig="stiff"
            offsetType="silhouette"
            stackTooltip={ProjectStackTooltip}
            theme={nivoTheme}
            tooltip={ProjectLayerTooltip}
          />
        </StreamChartDataContext.Provider>
      </div>
    </div>
  )
}
