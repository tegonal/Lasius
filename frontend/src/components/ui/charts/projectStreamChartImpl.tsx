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
import { EmptyStateStats } from 'components/ui/data-display/fetchState/emptyStateStats'
import { logger } from 'lib/logger'
import React from 'react'
import { NivoChartDataType } from 'types/common'

import { ChartSingleTooltip, ChartStackTooltip } from './shared/chartTooltips'
import { useNivoColors } from './shared/getConsistentColor'

type Props = {
  data: NivoChartDataType
  keys: string[]
}

export const ProjectStreamChartImpl: React.FC<Props> = ({ data, keys }) => {
  const nivoColors = useNivoColors()

  // Debug logging
  console.log('[ProjectStreamChartImpl] Received data:', data)
  console.log('[ProjectStreamChartImpl] Received keys (project names):', keys)

  // Validate data
  if (!data || !keys || !Array.isArray(data) || !Array.isArray(keys)) {
    logger.error('[ProjectStreamChartImpl] Invalid data or keys:', { data, keys })
    return (
      <div className="h-80 w-full">
        <EmptyStateStats />
      </div>
    )
  }

  // Check if we have any actual data
  const hasData = keys.length > 0 && data.some((d) => keys.some((key) => (d[key]?.[0] || 0) > 0))

  if (!hasData) {
    return (
      <div className="h-80 w-full">
        <EmptyStateStats />
      </div>
    )
  }

  // Transform data for stream chart - extract hours from [hours, count] arrays
  const streamData = data.map((item) => {
    const transformed: any = {}
    keys.forEach((key) => {
      // Extract hours value from [hours, count] array, default to 0
      const value = item[key]
      transformed[key] = Array.isArray(value) ? value[0] || 0 : 0
    })
    return transformed
  })

  console.log('[ProjectStreamChartImpl] Transformed streamData:', streamData)

  // Theme using DaisyUI CSS variables
  const theme = {
    text: {
      fill: 'var(--color-base-content)',
      fillOpacity: 0.8,
      fontSize: 14,
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
          fontSize: 14,
        },
      },
      legend: {
        text: {
          fill: 'var(--color-base-content)',
          fillOpacity: 0.9,
          fontSize: 14,
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
        fontSize: 14,
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
      <div className="h-80 w-full">
        <ResponsiveStream
          data={streamData}
          keys={keys}
          margin={{ top: 20, right: 20, bottom: 50, left: 20 }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            format: (value) => {
              const item = data[value]
              // Always format as DD.MM regardless of granularity
              const category = item?.category || value
              return String(category)
            },
          }}
          axisLeft={null}
          enableGridX={false}
          enableGridY={false}
          offsetType="silhouette"
          colors={nivoColors}
          fillOpacity={0.85}
          borderWidth={0}
          animate={false}
          motionConfig="stiff"
          isInteractive={true}
          enableStackTooltip={true}
          enableDots={true}
          dotSize={8}
          dotColor={{ from: 'color' }}
          dotBorderWidth={2}
          dotBorderColor={{ from: 'color', modifiers: [['darker', 0.7]] }}
          theme={theme}
          stackTooltip={({ slice }) => (
            <ChartStackTooltip
              slice={slice}
              getTitle={(index) => {
                const item = data[index]
                return item?.category || `${index}`
              }}
              formatValue={(value) => `${value.toFixed(1)}h`}
              formatLabel={(id) => id || ''}
            />
          )}
          tooltip={({ point }) => (
            <ChartSingleTooltip point={point} formatValue={(value) => `${value.toFixed(1)}h`} />
          )}
        />
      </div>
    </div>
  )
}
