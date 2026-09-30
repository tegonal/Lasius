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

import { PieDiagram } from '~/components/ui/charts/pie-diagram'

import { EmptyStateStats } from './empty-state-stats'
import { StatsTile } from './stats-tile'

type StatsCircleCategoryRangeProperties = {
  chartData:
    | undefined
    | {
        data: undefined | { id: string; value: number }[]
        keys?: (null | string | undefined)[]
      }
}

export const StatsCircleCategoryRange = ({ chartData }: StatsCircleCategoryRangeProperties) => {
  if (!chartData?.data || chartData.data.length === 0) {
    return (
      <StatsTile className="h-[340px]">
        <EmptyStateStats />
      </StatsTile>
    )
  }

  return (
    <StatsTile className="h-[340px]">
      <PieDiagram stats={chartData} />
    </StatsTile>
  )
}
