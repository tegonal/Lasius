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

import { lazy, Suspense } from 'react'

import { type NivoChartDataType } from '~/lib/api/functions/get-nivo-chart-data-from-api-stats-data'

import { EmptyStateStats } from './empty-state-stats'
import { StatsTile } from './stats-tile'

const ProjectStreamChartImpl = lazy(() =>
  import('~/features/stats/components/project-stream-chart-impl').then(
    (mod) => ({
      default: mod.ProjectStreamChartImpl,
    }),
  ),
)

const BarsHours = lazy(() =>
  import('./bars-hours').then((mod) => ({
    default: mod.BarsHours,
  })),
)

type StatsProjectStreamProps = {
  chartData:
    | undefined
    | {
        ceilingData: NivoChartDataType
        data: NivoChartDataType
        keys: string[]
      }
  useBarChart: boolean
}

export const StatsProjectStream = ({
  chartData,
  useBarChart,
}: StatsProjectStreamProps) => {
  if (!chartData?.data || chartData.data.length === 0) {
    return (
      <StatsTile className="h-[320px]">
        <EmptyStateStats />
      </StatsTile>
    )
  }

  if (useBarChart) {
    return (
      <StatsTile className="h-[320px]">
        <Suspense
          fallback={
            <div className="bg-base-200 flex h-full w-full items-center justify-center rounded-lg">
              <span className="loading loading-spinner loading-md" />
            </div>
          }
        >
          <BarsHours groupMode="stacked" indexBy="category" stats={chartData} />
        </Suspense>
      </StatsTile>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="bg-base-200 h-80 w-full animate-pulse rounded-lg p-4">
          <span className="loading loading-spinner loading-md" />
        </div>
      }
    >
      <ProjectStreamChartImpl data={chartData.data} keys={chartData.keys} />
    </Suspense>
  )
}
