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
import { apiDatespanFromTo, granularityFromDatespanFromTo } from 'lib/api/apiDateHandling'
import { getNivoChartDataFromApiStatsData } from 'lib/api/functions/getNivoChartDataFromApiStatsData'
import { useGetWeeklyPlannedWorkingHoursAggregate } from 'lib/api/hooks/useGetWeeklyPlannedWorkingHoursAggregate'
import { useGetUserBookingAggregatedStatsByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import { useMemo } from 'react'
import { UserBookingSource } from 'types/booking'
import { Granularity } from 'types/common'

/**
 * Custom hook for fetching and transforming user booking statistics by source and day.
 * Retrieves aggregated booking data for the current user within a specific organisation and date range,
 * then transforms it into Nivo chart-compatible format for visualization in statistics views.
 *
 * @param orgId - Organisation ID to fetch user statistics for
 * @param options - Configuration object containing:
 *   - source: Source type to filter bookings (e.g., 'UserBooking', 'ProjectBooking')
 *   - from: Start date of the date range (ISO date string)
 *   - to: End date of the date range (ISO date string)
 *   - granularity: Optional time granularity for aggregation (auto-calculated from date range if not provided)
 *
 * @returns Object containing:
 *   - data: Transformed statistics data in Nivo chart format (undefined if loading/no data)
 *   - isValidating: Boolean indicating if data is currently being revalidated
 *   - error: Error object if the request failed
 *
 * @example
 * const { data, isValidating } = useGetUserStatsBySourceAndDay(
 *   'org-123',
 *   {
 *     source: 'UserBooking',
 *     from: '2025-01-01',
 *     to: '2025-01-31',
 *     granularity: 'Week'
 *   }
 * )
 *
 * if (isValidating) return <Spinner />
 * if (data) return <BarChart data={data} />
 *
 * @remarks
 * - Uses custom statsSwrConfig for optimized caching strategy
 * - Automatically determines granularity from date range if not specified
 * - Includes planned working hours context for comparison in charts
 * - Data is memoized to prevent unnecessary transformations
 * - Handles invalid date ranges gracefully (empty from/to strings)
 * - Transformed data structure is optimized for Nivo chart rendering
 */
export const useGetUserStatsBySourceAndDay = (
  orgId: string,
  {
    source,
    from,
    to,
    granularity,
  }: { source: UserBookingSource; from: string; to: string; granularity?: Granularity },
) => {
  const localGranularity = granularity || granularityFromDatespanFromTo(from, to)
  const { selectedOrganisationWorkingHours } = useGetWeeklyPlannedWorkingHoursAggregate()
  const timespan = apiDatespanFromTo(from, to)

  const { data, isValidating, error } = useGetUserBookingAggregatedStatsByOrganisation(
    orgId,
    timespan
      ? {
          source,
          from: timespan.from || '',
          to: timespan.to || '',
          granularity: localGranularity,
        }
      : { source, from: '', to: '', granularity: localGranularity },
    statsSwrConfig,
  )

  const transformedData = useMemo(() => {
    if (data) {
      return getNivoChartDataFromApiStatsData(
        data,
        localGranularity,
        selectedOrganisationWorkingHours,
      )
    }
    return undefined
  }, [data, localGranularity, selectedOrganisationWorkingHours])

  return { data: transformedData, isValidating, error }
}
