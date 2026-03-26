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

import { sumBy } from 'es-toolkit'

import { MS_PER_HOUR } from '~/config/constants'
import { type ModelsBookingStats } from '~/services/api/lasius/modelsBookingStats'

export type ProjectSummary = {
  hours: number
  name: string
  percentage: number
}

export const aggregateProjectHours = (
  data?: ModelsBookingStats[],
  topN?: number,
): ProjectSummary[] => {
  if (!data) return []

  const projectHours: Record<string, number> = {}
  for (const entry of data) {
    for (const item of entry.values) {
      const name = item.label
      if (!name) continue
      const hours = (item.duration ?? 0) / MS_PER_HOUR
      if (hours > 0) {
        projectHours[name] = (projectHours[name] || 0) + hours
      }
    }
  }

  let sorted = Object.entries(projectHours).toSorted(([, a], [, b]) => b - a)
  if (topN !== undefined) {
    sorted = sorted.slice(0, topN)
  }
  const total = sumBy(sorted, ([, hours]) => hours)

  return sorted.map(([name, hours]) => ({
    hours,
    name,
    percentage: total > 0 ? (hours / total) * 100 : 0,
  }))
}
