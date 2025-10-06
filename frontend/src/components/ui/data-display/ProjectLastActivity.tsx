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

import { Text } from 'components/primitives/typography/Text'
import { format } from 'date-fns'
import { useProjectLastActivity } from 'lib/api/hooks/useProjectLastActivity'
import React from 'react'

type Props = {
  orgId: string
  projectId: string
  lastActivityDate?: string | null
}

/**
 * Displays the last activity date for a project
 * If lastActivityDate is provided (even if null), displays it directly
 * Otherwise fetches the data asynchronously
 */
export const ProjectLastActivity: React.FC<Props> = ({ orgId, projectId, lastActivityDate }) => {
  // Only fetch if lastActivityDate was not provided at all (undefined)
  const shouldFetch = lastActivityDate === undefined
  const {
    lastActivityDate: fetchedDate,
    isLoading,
    error,
  } = useProjectLastActivity(orgId, projectId, shouldFetch)

  // Use provided date or fetched date
  const displayDate = lastActivityDate !== undefined ? lastActivityDate : fetchedDate

  if (shouldFetch && isLoading) {
    return <div className="skeleton h-4 w-20" />
  }

  if (shouldFetch && error) {
    return <Text variant="small">—</Text>
  }

  if (!displayDate) {
    return <Text variant="small">—</Text>
  }

  return <Text variant="small">{format(new Date(displayDate), 'dd.MM.yyyy')}</Text>
}
