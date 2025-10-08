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

import { statsSwrConfig } from 'components/ui/data-display/stats/statsSwrConfig'
import { apiDatespanFromTo } from 'lib/api/apiDateHandling'
import { getAdaptiveGranularity } from 'lib/api/config/granularityConfig'
import { getNivoChartDataFromApiStatsData } from 'lib/api/functions/getNivoChartDataFromApiStatsData'
import { useGetWeeklyPlannedWorkingHoursAggregate } from 'lib/api/hooks/useGetWeeklyPlannedWorkingHoursAggregate'
import { useGetOrganisationBookingAggregatedStats } from 'lib/api/lasius/organisation-bookings/organisation-bookings'
import { useMemo } from 'react'

/**
 * Custom hook for fetching organisation project statistics with adaptive granularity.
 * Automatically determines the best time granularity based on the selected date range.
 *
 * @param orgId - Organisation ID
 * @param from - Start date (ISO string)
 * @param to - End date (ISO string)
 * @returns Object containing chart data, loading state, and error
 */
export const useGetOrganisationProjectStreamStats = (orgId: string, from: string, to: string) => {
  const granularity = useMemo(() => getAdaptiveGranularity(from, to), [from, to])
  const { selectedOrganisationWorkingHours } = useGetWeeklyPlannedWorkingHoursAggregate()
  const datespan = apiDatespanFromTo(from, to)

  const { data, isValidating, error } = useGetOrganisationBookingAggregatedStats(
    orgId,
    {
      source: 'project',
      from: datespan?.from || '',
      to: datespan?.to || '',
      granularity,
    },
    statsSwrConfig,
  )

  const transformedData = useMemo(() => {
    if (data) {
      return getNivoChartDataFromApiStatsData(data, granularity, selectedOrganisationWorkingHours)
    }
    return undefined
  }, [data, granularity, selectedOrganisationWorkingHours])

  return { data: transformedData, isValidating, error, granularity }
}
