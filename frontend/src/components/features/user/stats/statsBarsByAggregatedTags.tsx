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

import { StatsTile } from 'components/ui/charts/statsTile'
import { EmptyStateStats } from 'components/ui/data-display/fetchState/emptyStateStats'
import { Loading } from 'components/ui/data-display/fetchState/loading'
import { statsSwrConfig } from 'components/ui/data-display/stats/statsSwrConfig'
import { apiDatespanFromTo } from 'lib/api/apiDateHandling'
import { getTransformedChartDataAggregate } from 'lib/api/functions/getTransformedChartDataAggregate'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useGetUserBookingAggregatedStatsByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import dynamic from 'next/dynamic'
import React, { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

const BarsTags = dynamic(() => import('../../../../components/ui/charts/barsTags'), { ssr: false })

export const StatsBarsByAggregatedTags: React.FC = () => {
  const { selectedOrganisationId } = useOrganisation()
  const parentFormContext = useFormContext()

  const datespan = apiDatespanFromTo(parentFormContext.watch('from'), parentFormContext.watch('to'))
  const { data, isValidating } = useGetUserBookingAggregatedStatsByOrganisation(
    selectedOrganisationId,
    {
      source: 'tag',
      from: datespan?.from || '',
      to: datespan?.to || '',
      granularity: 'All',
    },
    statsSwrConfig,
  )

  const chartData = useMemo(() => getTransformedChartDataAggregate(data, 20), [data])

  if (isValidating) {
    return (
      <StatsTile className="h-[300px]">
        <Loading />
      </StatsTile>
    )
  }

  if (!chartData?.data || chartData.data.length === 0) {
    return (
      <StatsTile className="h-[300px]">
        <EmptyStateStats />
      </StatsTile>
    )
  }

  return (
    <StatsTile
      className="min-h-[200px]"
      style={{ height: `${(chartData?.data?.length || 0) * 36}px` }}>
      <BarsTags stats={chartData} />
    </StatsTile>
  )
}
