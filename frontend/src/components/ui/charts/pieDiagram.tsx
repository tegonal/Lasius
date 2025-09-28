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
import { ResponsivePie } from '@nivo/pie'
import { nivoTheme } from 'components/ui/charts/nivoTheme'
import React from 'react'
import { nivoPalette } from 'styles/colors'
import { NivoChartDataType } from 'types/common'

import { TooltipContainer, TooltipItem } from './shared/chartTooltips'
import { getContrastLabelTextColor } from './shared/chartUtils'

type Props = {
  stats: { data: NivoChartDataType | undefined }
}

const PieDiagram: React.FC<Props> = ({ stats /* see data tab */ }) => {
  const { data } = stats
  if (!data) return null

  return (
    <ResponsivePie
      data={data}
      theme={nivoTheme}
      colors={nivoPalette}
      margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
      innerRadius={0.5}
      padAngle={0.75}
      cornerRadius={3}
      activeOuterRadiusOffset={8}
      arcLinkLabelsSkipAngle={12}
      arcLinkLabelsTextColor="var(--color-base-content)"
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: 'color' }}
      arcLinkLabel={(item) => `${item.id}`}
      arcLabel={(item) => `${item.value}h`}
      arcLabelsRadiusOffset={0.55}
      arcLabelsSkipAngle={20}
      arcLabelsTextColor={getContrastLabelTextColor}
      tooltip={({ datum }) => (
        <TooltipContainer>
          <TooltipItem color={datum.color} label={datum.id} value={`${datum.value}h`} />
        </TooltipContainer>
      )}
    />
  )
}

export default PieDiagram
