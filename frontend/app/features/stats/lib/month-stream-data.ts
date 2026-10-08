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

export type MonthlyWeekStreamData = MonthlyWeekStreamDataItem[]
export type MonthlyWeekStreamDataItem = Record<string, number>

/** True for seven weekday rows whose values are numbers of 0 or more. */
export const isValidMonthlyWeekStreamData = (data: unknown): data is MonthlyWeekStreamData => {
  if (!Array.isArray(data) || data.length !== 7) return false
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      Object.values(item).every((v) => typeof v === 'number' && v >= 0),
  )
}

/**
 * The rows and keys for the Nivo stream, or null for the empty state. Nivo needs a number for every
 * key in every row (pitfall rr7-nivo-stream-empty-data).
 */
export const prepareMonthStreamData = (
  data: unknown,
  keys: unknown,
): null | { data: MonthlyWeekStreamData; keys: string[] } => {
  if (!isValidMonthlyWeekStreamData(data) || !Array.isArray(keys)) return null
  const weekKeys = keys as string[]
  const hasData =
    weekKeys.length > 0 && data.some((d) => weekKeys.some((key) => (d[key] as number) > 0))
  if (!hasData) return null

  return {
    data: data.map((item) => {
      const row: MonthlyWeekStreamDataItem = {}
      for (const key of weekKeys) {
        const value = item[key] ?? 0
        row[key] = Number.isNaN(value) ? 0 : value
      }
      return row
    }),
    keys: weekKeys,
  }
}
