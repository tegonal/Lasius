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
import { ResponsivePie } from '@nivo/pie'

import { type NivoChartDataType } from '~/lib/api/functions/get-nivo-chart-data-from-api-stats-data'

import { TooltipContainer, TooltipItem } from './chart-tooltips'
import {
  getContrastLabelTextColor,
  nivoTheme,
  useNivoColors,
} from './nivo-theme'

type Props = {
  stats: { data: NivoChartDataType | undefined }
}

const pieTheme = {
  ...nivoTheme,
  labels: {
    text: {
      fill: 'var(--color-base-content)',
      fontSize: 14,
      fontWeight: 400,
    },
  },
}

export const PieDiagram = ({ stats }: Props) => {
  const nivoColors = useNivoColors()
  const { data } = stats
  if (!data) return null

  return (
    <ResponsivePie
      activeOuterRadiusOffset={8}
      arcLabel={(item) => `${item.value}h`}
      arcLabelsRadiusOffset={0.55}
      arcLabelsSkipAngle={20}
      arcLabelsTextColor={getContrastLabelTextColor}
      arcLinkLabel={(item) => `${item.id}`}
      arcLinkLabelsColor={{ from: 'color' }}
      arcLinkLabelsFontSize={16}
      arcLinkLabelsSkipAngle={12}
      arcLinkLabelsTextColor="var(--color-base-content)"
      arcLinkLabelsThickness={2}
      colors={nivoColors}
      cornerRadius={3}
      data={data}
      innerRadius={0.5}
      margin={{ bottom: 40, left: 80, right: 80, top: 40 }}
      padAngle={0.75}
      theme={pieTheme}
      tooltip={({ datum }) => (
        <TooltipContainer>
          <TooltipItem
            color={datum.color}
            label={datum.id}
            value={`${datum.value}h`}
          />
        </TooltipContainer>
      )}
    />
  )
}

export default PieDiagram
