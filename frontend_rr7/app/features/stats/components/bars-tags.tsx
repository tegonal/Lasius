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

import { type BarTooltipProps, ResponsiveBar } from '@nivo/bar'

import {
  TooltipContainer,
  TooltipItem,
} from '~/components/ui/charts/chart-tooltips'
import {
  getContrastLabelTextColor,
  nivoTheme,
  useNivoColors,
} from '~/components/ui/charts/nivo-theme'
import { type NivoChartDataType } from '~/lib/api/functions/get-nivo-chart-data-from-api-stats-data'

type Props = {
  stats: { data: NivoChartDataType | undefined }
}

export const BarsTags = ({ stats }: Props) => {
  const nivoColors = useNivoColors()
  const { data } = stats
  if (!data) return null
  return (
    <ResponsiveBar
      axisBottom={{
        tickPadding: 5,
        tickRotation: 0,
        tickSize: 5,
      }}
      axisLeft={{
        format: (value: number | string) => {
          const strValue = String(value)
          return strValue.length > 16 ? `${strValue.slice(0, 16)}...` : strValue
        },
        tickPadding: 5,
        tickRotation: 0,
        tickSize: 5,
      }}
      axisRight={null}
      axisTop={{
        tickPadding: 5,
        tickRotation: 0,
        tickSize: 5,
      }}
      borderRadius={3}
      borderWidth={0}
      colors={nivoColors}
      data={data as Array<{ id: string; value: number }>}
      enableGridX
      enableGridY={false}
      indexBy="id"
      indexScale={{ round: true, type: 'band' }}
      keys={['value']}
      label={(d) => `${d.value}h`}
      labelSkipHeight={12}
      labelSkipWidth={30}
      labelTextColor={getContrastLabelTextColor}
      layout="horizontal"
      margin={{ bottom: 60, left: 140, right: 50, top: 60 }}
      padding={0.3}
      theme={nivoTheme}
      tooltip={(props: BarTooltipProps<{ id: string; value: number }>) => (
        <TooltipContainer>
          <TooltipItem
            color={props.color}
            label={String(props.indexValue)}
            value={`${props.value}h`}
          />
        </TooltipContainer>
      )}
      valueScale={{ type: 'linear' }}
    />
  )
}

export default BarsTags
