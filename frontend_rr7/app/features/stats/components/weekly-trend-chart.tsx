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

import { type Point, ResponsiveLine } from '@nivo/line'
import { useTranslation } from 'react-i18next'

import { nivoTheme, useNivoColors } from '~/components/ui/charts/nivo-theme'
import { EmptyStateStats } from '~/features/stats/components/empty-state-stats'
import { decimalHoursToDurationString } from '~/lib/utils/duration'

// ─── Types ───────────────────────────────────────────────────────────────────

export type WeekData = {
  hours: number
  plannedHours: number
  weekLabel: string
  weekNumber: number
  year: number
}

// ─── Empty State ─────────────────────────────────────────────────────────────

/**
 * Displays a line chart showing weekly work hours trend over time.
 * Shows actual hours vs planned hours with visual indicators for overtime.
 */
export const WeeklyTrendChart = ({
  tickEvery,
  weeklyData,
}: {
  tickEvery?: number
  weeklyData: WeekData[]
}) => {
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
      data: weeklyData.map((week) => ({
        x: week.weekLabel,
        y: week.hours,
      })),
      id: t('workHealth.actualHours', { defaultValue: 'actual' }),
    },
    {
      data: weeklyData.map((week) => ({
        x: week.weekLabel,
        y: week.plannedHours,
      })),
      id: t('workHealth.plannedHours', { defaultValue: 'planned' }),
    },
  ]

  // Calculate max value for Y axis to determine tick values
  const maxHours = Math.max(
    ...weeklyData.map((w) => w.hours),
    ...weeklyData.map((w) => w.plannedHours),
  )
  const smallStep = maxHours > 50 ? 10 : 5
  const tickStep = maxHours > 100 ? 20 : smallStep

  return (
    <div className="h-64 w-full">
      <ResponsiveLine
        areaOpacity={0.1}
        axisBottom={{
          format: (value: string) => value.replace(/\/\d{4}$/, ''),
          tickPadding: 5,
          tickRotation: -45,
          tickSize: 5,
          tickValues: tickEvery
            ? weeklyData
                .filter((_, i) => i % tickEvery === 0)
                .map((w) => w.weekLabel)
            : undefined,
        }}
        axisLeft={{
          format: (value) => decimalHoursToDurationString(value),
          tickPadding: 5,
          tickRotation: 0,
          tickSize: 5,
          tickValues: tickStep,
        }}
        axisRight={null}
        axisTop={null}
        colors={nivoColors}
        curve="monotoneX"
        data={chartData}
        enableArea={true}
        enableGridX={false}
        enablePoints={true}
        legends={[
          {
            anchor: 'top-left',
            direction: 'row',
            effects: [
              {
                on: 'hover',
                style: {
                  itemBackground: 'rgba(0, 0, 0, .03)',
                  itemOpacity: 1,
                },
              },
            ],
            itemDirection: 'left-to-right',
            itemHeight: 20,
            itemOpacity: 0.75,
            itemsSpacing: 20,
            itemWidth: 100,
            justify: false,
            symbolBorderColor: 'rgba(0, 0, 0, .5)',
            symbolShape: 'circle',
            symbolSize: 12,
            translateX: 0,
            translateY: -20,
          },
        ]}
        margin={{ bottom: 40, left: 50, right: 20, top: 20 }}
        pointBorderColor={{ from: 'serieColor' }}
        pointBorderWidth={2}
        pointColor={{ theme: 'background' }}
        pointLabelYOffset={-12}
        pointSize={8}
        theme={nivoTheme}
        tooltip={({ point }: { point: Point }) => (
          <div className="bg-base-100 border-base-300 rounded-lg border px-3 py-2 shadow-lg">
            <div className="text-sm font-medium">{String(point.seriesId)}</div>
            <div className="text-base-content/60 text-sm">
              {point.data.x}:{' '}
              <strong>
                {decimalHoursToDurationString(point.data.y as number)}
              </strong>
            </div>
          </div>
        )}
        useMesh={true}
        xScale={{ type: 'point' }}
        yFormat={(value) => decimalHoursToDurationString(value)}
        yScale={{
          max: 'auto',
          min: 0,
          reverse: false,
          stacked: false,
          type: 'linear',
        }}
      />
    </div>
  )
}
