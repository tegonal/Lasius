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

import { useGetProjectLastActivityDate } from 'lib/api/lasius/projects/projects'

/**
 * Hook to fetch the last activity date for a project
 * Uses the dedicated /last-activity endpoint
 * @param enabled - Whether to enable the query (default: true)
 */
export const useProjectLastActivity = (orgId: string, projectId: string, enabled = true) => {
  const { data, error, isLoading } = useGetProjectLastActivityDate(orgId, projectId, {
    swr: {
      enabled,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // Cache for 5 minutes
    },
  })

  return {
    lastActivityDate: data,
    isLoading,
    error,
  }
}
