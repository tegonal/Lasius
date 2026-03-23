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

import { type BarChartGroupMode } from './bars-hours'
import { EmptyStateStats } from './empty-state-stats'
import { StatsTile } from './stats-tile'

const BarsHours = lazy(() =>
  import('./bars-hours').then((mod) => ({
    default: mod.BarsHours,
  })),
)

type StatsBarsBySourceProps = {
  chartData:
    | undefined
    | {
        ceilingData: NivoChartDataType
        data: NivoChartDataType
        keys: string[]
      }
  groupMode: BarChartGroupMode
}

export const StatsBarsBySource = ({
  chartData,
  groupMode,
}: StatsBarsBySourceProps) => {
  if (!chartData?.data || chartData.data.length === 0) {
    return (
      <StatsTile className="h-[240px]">
        <EmptyStateStats />
      </StatsTile>
    )
  }

  return (
    <StatsTile className="h-[240px]">
      <Suspense
        fallback={
          <div className="bg-base-200 flex h-full w-full items-center justify-center rounded-lg">
            <span className="loading loading-spinner loading-md" />
          </div>
        }
      >
        <BarsHours groupMode={groupMode} indexBy="category" stats={chartData} />
      </Suspense>
    </StatsTile>
  )
}
