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

export type ProjectSummary = {
  name: string
  hours: number
  percentage: number
}

/**
 * Aggregates project hours from stats API data, sorts by hours descending,
 * and optionally limits to top N projects.
 *
 * @param data - Array of stats data objects from useGetUserStatsBySourceAndDay.
 *   Each object has a 'category' key plus project keys with [hours] arrays.
 * @param topN - Optional limit for top N projects. Omit to return all.
 * @returns Sorted array of project summaries with name, hours, and percentage.
 */
export const aggregateProjectHours = (
  data: Record<string, unknown>[] | undefined,
  topN?: number,
): ProjectSummary[] => {
  if (!data) return []

  const projectHours: Record<string, number> = {}
  data.forEach((entry) => {
    Object.entries(entry).forEach(([key, value]) => {
      if (key !== 'category' && Array.isArray(value)) {
        const hours = value[0] as number
        if (hours > 0) {
          projectHours[key] = (projectHours[key] || 0) + hours
        }
      }
    })
  })

  let sorted = Object.entries(projectHours).sort(([, a], [, b]) => b - a)
  if (topN !== undefined) {
    sorted = sorted.slice(0, topN)
  }
  const total = sorted.reduce((sum, [, hours]) => sum + hours, 0)

  return sorted.map(([name, hours]) => ({
    name,
    hours,
    percentage: total > 0 ? (hours / total) * 100 : 0,
  }))
}
