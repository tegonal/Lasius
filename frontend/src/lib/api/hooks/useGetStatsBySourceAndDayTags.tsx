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

import { apiDatespanFromTo, granularityFromDatespanFromTo } from 'lib/api/apiDateHandling'
import { getNivoChartDataFromApiStatsData } from 'lib/api/functions/getNivoChartDataFromApiStatsData'
import { useGetWeeklyPlannedWorkingHoursAggregate } from 'lib/api/hooks/useGetWeeklyPlannedWorkingHoursAggregate'
import { useGetUserBookingAggregatedStatsByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import { useMemo } from 'react'
import { UserBookingSource } from 'types/booking'
import { Granularity } from 'types/common'

export const useGetStatsBySourceAndDayTags = (
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
  const { data, isValidating, error } = useGetUserBookingAggregatedStatsByOrganisation(orgId, {
    source,
    ...apiDatespanFromTo(from, to),
    granularity: localGranularity,
  })

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
