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

const DATE_RANGE_KEYS = ['from', 'to', 'dateRange'] as const

// A tab link keeps the selected date range and adds its own params.
export const getStatsTabSearch = (
  current: URLSearchParams,
  tabParameters: Record<string, string> = {},
): string => {
  const parameters = new URLSearchParams()
  for (const key of DATE_RANGE_KEYS) {
    const value = current.get(key)
    if (value) parameters.set(key, value)
  }
  const extraEntries = Object.entries(tabParameters)
  for (const [key, value] of extraEntries) parameters.set(key, value)
  return parameters.size > 0 ? `?${parameters}` : ''
}
