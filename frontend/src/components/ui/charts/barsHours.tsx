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

import { BarCustomLayerProps, BarDatum, ResponsiveBar } from '@nivo/bar'
import { line } from 'd3-shape'
import React from 'react'
import { NivoChartDataType } from 'types/common'

import { nivoTheme } from './nivoTheme'
import { TooltipContainer, TooltipItem } from './shared/chartTooltips'
import { getContrastLabelTextColor } from './shared/chartUtils'
import { useNivoColors } from './shared/getConsistentColor'

const Line =
  (props: { category: string; value: number }[] | undefined) =>
  (layerProps: BarCustomLayerProps<BarDatum>) => {
    if (!props) return null
    const { xScale, yScale, bars } = layerProps

    const lineBegins = line<{ category: string; value: number }>()
      .x((item) => {
        const scaleValue = xScale(item.category as any)
        return (scaleValue as number) + (bars[0]?.width || 0) / 2
      })
      .y((item) => yScale(item.value) as number)

    return (
      <path
        d={lineBegins(props) || undefined}
        fill="none"
        stroke="oklch(var(--color-secondary))"
        strokeWidth={1}
        style={{ pointerEvents: 'none' }}
      />
    )
  }

export type BarChartGroupMode = 'grouped' | 'stacked'

type Props = {
  stats: { data: NivoChartDataType; keys: string[]; ceilingData: NivoChartDataType } | undefined
  indexBy: string
  groupMode: BarChartGroupMode
}

const BarsHours: React.FC<Props> = ({ stats, indexBy, groupMode }) => {
  const nivoColors = useNivoColors()
  const { data, keys, ceilingData } = stats || {}
  if (!data) return null
  return (
    <ResponsiveBar
      data={data}
      keys={keys}
      indexBy={indexBy}
      theme={nivoTheme}
      colors={nivoColors}
      groupMode={groupMode}
      margin={{ top: 25, right: 30, bottom: 60, left: 60 }}
      padding={0.3}
      valueScale={{ type: 'linear' }}
      indexScale={{ type: 'band', round: true }}
      borderWidth={0}
      borderRadius={3}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
      }}
      label={(d) => `${d.value}h`}
      labelSkipWidth={20}
      labelSkipHeight={12}
      labelTextColor={getContrastLabelTextColor}
      tooltip={({ id, value, color, indexValue }) => (
        <TooltipContainer title={String(indexValue)}>
          <TooltipItem color={color} label={String(id)} value={`${value}h`} />
        </TooltipContainer>
      )}
      layers={[
        'axes',
        'grid',
        'bars',
        'legends',
        Line(ceilingData as { category: string; value: number }[] | undefined),
      ]}
    />
  )
}

export default BarsHours
