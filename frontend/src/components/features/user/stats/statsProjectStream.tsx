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
import { apiDatespanFromTo } from 'lib/api/apiDateHandling'
import { shouldUseBarChart } from 'lib/api/config/granularityConfig'
import { useGetUserProjectStreamStats } from 'lib/api/hooks/useGetUserProjectStreamStats'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import dynamic from 'next/dynamic'
import React, { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

const ProjectStreamChartImpl = dynamic(
  () =>
    import('../../../../components/ui/charts/projectStreamChartImpl').then(
      (mod) => mod.ProjectStreamChartImpl,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="bg-base-200 h-80 w-full rounded-lg p-4">
        <Loading />
      </div>
    ),
  },
)

const BarsHours = dynamic(() => import('../../../../components/ui/charts/barsHours'), {
  ssr: false,
})

export const StatsProjectStream: React.FC = () => {
  const { selectedOrganisationId } = useOrganisation()
  const parentFormContext = useFormContext()

  const fromDate = parentFormContext.watch('from')
  const toDate = parentFormContext.watch('to')

  const datespan = apiDatespanFromTo(fromDate, toDate)
  const { data, isValidating } = useGetUserProjectStreamStats(
    selectedOrganisationId,
    datespan?.from || '',
    datespan?.to || '',
  )

  // Calculate if we should use bar chart (<=2 past days) or stream chart
  const useBarChart = useMemo(() => {
    if (!fromDate || !toDate) return false
    return shouldUseBarChart(fromDate, toDate)
  }, [fromDate, toDate])

  if (isValidating) {
    return (
      <div className="bg-base-200 h-80 w-full rounded-lg p-4">
        <Loading />
      </div>
    )
  }

  if (!data) {
    return (
      <StatsTile className="h-[320px]">
        <EmptyStateStats />
      </StatsTile>
    )
  }

  // Use bar chart for short time periods (<=2 days)
  if (useBarChart) {
    return (
      <StatsTile className="h-[320px]">
        <BarsHours stats={data} indexBy="category" groupMode="stacked" />
      </StatsTile>
    )
  }

  // Use stream chart for longer periods
  return <ProjectStreamChartImpl data={data.data} keys={data.keys} />
}
