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

import { ResponsiveBar } from '@nivo/bar'
import { nivoTheme } from 'components/ui/charts/nivoTheme'
import { line } from 'd3-shape'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { NivoChartDataType } from 'types/common'

import { TooltipContainer, TooltipItem } from './shared/chartTooltips'
import { getContrastLabelTextColor } from './shared/chartUtils'
import { useNivoColors } from './shared/getConsistentColor'

const Line =
  (props: { category: string; value: number }[]) =>
  (layerProps: { bars: any; xScale: any; yScale: any }) => {
    const { xScale, yScale } = layerProps

    const lineBegins = line()
      .x((item) => xScale(item.category) + layerProps.bars[0].width / 2)
      .y((item) => yScale(item.value))

    return (
      <path
        d={lineBegins(props)}
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
  const { t } = useTranslation('common')
  const nivoColors = useNivoColors()
  const { data, keys, ceilingData } = stats
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
      cornerRadius={3}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: t('common.time.date', { defaultValue: 'Date' }),
        legendPosition: 'middle',
        legendOffset: 40,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: t('common.units.hours', { defaultValue: 'Hours' }),
        legendPosition: 'middle',
        legendOffset: -40,
      }}
      labelSkipWidth={20}
      labelSkipHeight={12}
      labelTextColor={getContrastLabelTextColor}
      tooltip={({ id, value, color, indexValue }) => (
        <TooltipContainer title={String(indexValue)}>
          <TooltipItem color={color} label={String(id)} value={`${value}h`} />
        </TooltipContainer>
      )}
      layers={['axes', 'grid', 'bars', 'legends', Line(ceilingData)]}
    />
  )
}

export default BarsHours
