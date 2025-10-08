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

import { BarTooltipProps, ResponsiveBar } from '@nivo/bar'
import { nivoTheme } from 'components/ui/charts/nivoTheme'
import React from 'react'
import { NivoChartDataType } from 'types/common'

import { TooltipContainer, TooltipItem } from './shared/chartTooltips'
import { getContrastLabelTextColor } from './shared/chartUtils'
import { useNivoColors } from './shared/getConsistentColor'

type Props = {
  stats: { data: NivoChartDataType | undefined }
}

const BarsTags: React.FC<Props> = ({ stats }) => {
  const nivoColors = useNivoColors()
  const { data } = stats
  if (!data) return null
  return (
    <ResponsiveBar
      data={data as Array<{ id: string; value: number }>}
      theme={nivoTheme}
      keys={['value']}
      indexBy="id"
      layout="horizontal"
      enableGridX
      enableGridY={false}
      colors={nivoColors}
      margin={{ top: 60, right: 50, bottom: 60, left: 140 }}
      padding={0.3}
      valueScale={{ type: 'linear' }}
      indexScale={{ type: 'band', round: true }}
      borderWidth={0}
      borderRadius={3}
      axisTop={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
      }}
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
        format: (value: string | number) => {
          const strValue = String(value)
          return strValue.length > 16 ? `${strValue.substring(0, 16)}...` : strValue
        },
      }}
      labelSkipWidth={30}
      labelSkipHeight={12}
      labelTextColor={getContrastLabelTextColor}
      label={(d) => `${d.value}h`}
      tooltip={(props: BarTooltipProps<{ id: string; value: number }>) => (
        <TooltipContainer>
          <TooltipItem
            color={props.color}
            label={String(props.indexValue)}
            value={`${props.value}h`}
          />
        </TooltipContainer>
      )}
    />
  )
}

export default BarsTags
