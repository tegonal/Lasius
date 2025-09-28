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

import { Loading } from 'components/ui/data-display/fetchState/loading'
import { MonthlyWeekStreamData, MonthlyWeekStreamKeys } from 'lib/schemas/chartSchemas'
import dynamic from 'next/dynamic'
import React from 'react'

type Props = {
  data: MonthlyWeekStreamData
  keys: MonthlyWeekStreamKeys
  isLoading?: boolean
}

// Dynamically import the chart implementation with SSR disabled
const MonthStreamChartImpl = dynamic(
  () => import('./monthStreamChartImpl').then((mod) => mod.MonthStreamChartImpl),
  {
    ssr: false,
    loading: () => (
      <div className="bg-base-200 h-64 w-full rounded-lg p-4">
        <Loading />
      </div>
    ),
  },
)

export const MonthStreamChart: React.FC<Props> = ({ data, keys, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-base-200 h-64 w-full rounded-lg p-4">
        <Loading />
      </div>
    )
  }

  return <MonthStreamChartImpl data={data} keys={keys} />
}
