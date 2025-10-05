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

import { ResponsiveLine } from '@nivo/line'
import { nivoTheme } from 'components/ui/charts/nivoTheme'
import { useNivoColors } from 'components/ui/charts/shared/getConsistentColor'
import { EmptyStateStats } from 'components/ui/data-display/fetchState/emptyStateStats'
import { WeekData } from 'lib/api/hooks/useWorkHealthMetrics'
import { decimalHoursToDurationString } from 'lib/utils/date/dates'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  weeklyData: WeekData[]
}

/**
 * Displays a line chart showing weekly work hours trend over time
 * Shows actual hours vs planned hours with visual indicators for overtime
 */
export const WeeklyTrendChart: React.FC<Props> = ({ weeklyData }) => {
  const { t } = useTranslation('common')
  const nivoColors = useNivoColors()

  if (!weeklyData || weeklyData.length === 0) {
    return (
      <div className="h-64 w-full">
        <EmptyStateStats />
      </div>
    )
  }

  // Transform data for Nivo
  const chartData = [
    {
      id: t('workHealth.actualHours', { defaultValue: 'Actual Hours' }),
      data: weeklyData.map((week) => ({
        x: week.weekLabel,
        y: week.hours,
      })),
    },
    {
      id: t('workHealth.plannedHours', { defaultValue: 'Planned Hours' }),
      data: weeklyData.map((week) => ({
        x: week.weekLabel,
        y: week.plannedHours,
      })),
    },
  ]

  // Calculate max value for Y axis to determine tick values
  const maxHours = Math.max(
    ...weeklyData.map((w) => w.hours),
    ...weeklyData.map((w) => w.plannedHours),
  )
  const tickStep = maxHours > 100 ? 20 : maxHours > 50 ? 10 : 5

  return (
    <div className="h-64 w-full">
      <ResponsiveLine
        data={chartData}
        theme={nivoTheme}
        colors={nivoColors}
        margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 0,
          max: 'auto',
          stacked: false,
          reverse: false,
        }}
        yFormat={(value) => decimalHoursToDurationString(value)}
        curve="monotoneX"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          tickValues: tickStep,
          format: (value) => decimalHoursToDurationString(value),
        }}
        enablePoints={true}
        pointSize={8}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        enableArea={true}
        areaOpacity={0.1}
        useMesh={true}
        enableGridX={false}
        legends={[
          {
            anchor: 'top-left',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: -20,
            itemsSpacing: 20,
            itemDirection: 'left-to-right',
            itemWidth: 100,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: 'circle',
            symbolBorderColor: 'rgba(0, 0, 0, .5)',
            effects: [
              {
                on: 'hover',
                style: {
                  itemBackground: 'rgba(0, 0, 0, .03)',
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
        tooltip={({ point }) => (
          <div className="bg-base-100 border-base-300 rounded-lg border px-3 py-2 shadow-lg">
            <div className="text-sm font-medium">{point.serieId}</div>
            <div className="text-base-content/60 text-xs">
              {point.data.x}: <strong>{decimalHoursToDurationString(point.data.y)}</strong>
            </div>
          </div>
        )}
      />
    </div>
  )
}

export default WeeklyTrendChart
