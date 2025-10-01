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
import { useGetOrganisationBookingAggregatedStats } from 'lib/api/lasius/organisation-bookings/organisation-bookings'
import { useMemo } from 'react'
import { OrganisationBookingSource } from 'types/booking'
import { Granularity } from 'types/common'

/**
 * Custom hook for fetching and transforming organisation-wide booking statistics by source and day.
 * Retrieves aggregated booking data for all members of an organisation within a specific date range,
 * then transforms it into Nivo chart-compatible format for visualization in organisation statistics views.
 *
 * @param orgId - Organisation ID to fetch organisation-wide statistics for
 * @param options - Configuration object containing:
 *   - source: Source type to filter bookings (e.g., 'OrganisationBooking', 'AllBookings')
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
 * const { data, isValidating } = useGetOrganisationStatsBySourceAndDay(
 *   'org-123',
 *   {
 *     source: 'OrganisationBooking',
 *     from: '2025-01-01',
 *     to: '2025-01-31',
 *     granularity: 'Week'
 *   }
 * )
 *
 * if (isValidating) return <Loading />
 * if (data) return <OrgStatsChart data={data} />
 *
 * @remarks
 * - Aggregates statistics across all organisation members (not just current user)
 * - Uses custom statsSwrConfig for optimized caching strategy
 * - Automatically determines granularity from date range if not specified
 * - Includes planned working hours context for comparison in charts
 * - Data is memoized to prevent unnecessary transformations
 * - Typically used by organisation administrators for team oversight
 * - Transformed data structure is optimized for Nivo chart rendering
 */
export const useGetOrganisationStatsBySourceAndDay = (
  orgId: string,
  {
    source,
    from,
    to,
    granularity,
  }: { source: OrganisationBookingSource; from: string; to: string; granularity?: Granularity },
) => {
  const localGranularity = granularity || granularityFromDatespanFromTo(from, to)
  const { selectedOrganisationWorkingHours } = useGetWeeklyPlannedWorkingHoursAggregate()
  const datespan = apiDatespanFromTo(from, to)
  const { data, isValidating, error } = useGetOrganisationBookingAggregatedStats(
    orgId,
    {
      source,
      from: datespan?.from || '',
      to: datespan?.to || '',
      granularity: localGranularity,
    },
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
