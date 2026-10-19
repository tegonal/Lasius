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

import { logger } from '~/lib/logger'
import { getProjectsLastActivity } from '~/services/api/lasius/projects/projects'

/**
 * Returns the last activity date per project id. A failed request gives no dates, so the project
 * list still shows.
 */
export const loadLastActivityDates = async (
  orgId: string,
  headers: HeadersInit,
): Promise<Record<string, string>> => {
  try {
    const response = await getProjectsLastActivity(orgId, { headers })
    return Object.fromEntries(
      response.data.map((activity) => [activity.projectId, activity.lastActivity]),
    )
  } catch (error) {
    logger.error('Could not load the last activity dates of the projects', error)
    return {}
  }
}
