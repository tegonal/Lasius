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

import { formatDateTimeToURLParam } from 'lib/api/apiDateHandling'
import { useGetProjectBookingList } from 'lib/api/lasius/project-bookings/project-bookings'
import { useMemo } from 'react'

/**
 * Hook to fetch the most recent booking for a project
 * Uses a 10-year lookback window with limit=1 for efficiency
 */
export const useProjectLastActivity = (orgId: string, projectId: string) => {
  const params = useMemo(() => {
    const tenYearsAgo = new Date()
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)

    return {
      from: formatDateTimeToURLParam(tenYearsAgo),
      to: formatDateTimeToURLParam(new Date()),
      limit: 1,
      skip: 0,
    }
  }, [])

  const { data, error, isLoading } = useGetProjectBookingList(orgId, projectId, params, {
    swr: {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // Cache for 5 minutes
    },
  })

  return {
    lastActivityDate: data?.[0]?.start,
    isLoading,
    error,
  }
}
