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

import { lastDayOfMonth, lastDayOfWeek } from 'date-fns'

import { getCategoryLabel, type Granularity } from '~/lib/api/config/granularity-config'
import {
  getPlannedHoursForDay,
  getPlannedHoursForRange,
  type PlannedWorkingHours,
} from '~/lib/api/functions/get-planned-working-hours'
import { type ModelsBookingStats, type ModelsBookingStatsCategory } from '~/services/api/lasius'

import { millisToHours } from '../../utils/dates'

export type NivoChartDataType = Record<string, number | string>[]

/**
 * Returns the first day (Monday) of the specified ISO week.
 */
const getISOWeek = (w: number, y: number = new Date().getFullYear()) => {
  const d = new Date(y, 0, 4)
  d.setDate(d.getDate() - (d.getDay() || 7) + 1 + 7 * (w - 1))
  return d
}

/**
 * Get ceiling (planned hours) value for a category based on granularity.
 */
const getCeilingValues = (
  granularity: Granularity,
  item: ModelsBookingStatsCategory,
  plannedWorkingHours: null | PlannedWorkingHours | undefined,
): number => {
  if (!plannedWorkingHours) return 0

  // Each date uses the Date(year, monthIndex, day) form. A 'YYYY-MM-DD' string parses as UTC midnight,
  // which is the previous day west of UTC.
  const year = item.year as number
  const month = item.month as number

  switch (granularity) {
    case 'Day': {
      return getPlannedHoursForDay(
        new Date(year, month - 1, item.day as number),
        plannedWorkingHours,
      )
    }
    case 'Month': {
      const dateOfMonth = new Date(year, month - 1, 1)
      return getPlannedHoursForRange(dateOfMonth, lastDayOfMonth(dateOfMonth), plannedWorkingHours)
    }
    case 'Week': {
      const dateOfWeek = getISOWeek(item.week || 0, item.year || undefined)
      return getPlannedHoursForRange(
        dateOfWeek,
        lastDayOfWeek(dateOfWeek, { weekStartsOn: 1 }),
        plannedWorkingHours,
      )
    }
    case 'Year': {
      return getPlannedHoursForRange(
        new Date(year, 0, 1),
        new Date(year, 11, 31),
        plannedWorkingHours,
      )
    }
    default: {
      return 0
    }
  }
}

export const getNivoChartDataFromApiStatsData = (
  data: ModelsBookingStats[],
  granularity: Granularity,
  plannedWorkingHours?: null | PlannedWorkingHours,
) => {
  if (data.length === 0) return

  const chartData: NivoChartDataType = data.map((cat) => {
    const categoryLabel = getCategoryLabel(cat.category, granularity)
    const categoryValues = Object.fromEntries(
      cat.values.map((item) => [item.label || '', millisToHours(item.duration || 0)]),
    )
    return {
      category: categoryLabel,
      ...categoryValues,
    }
  })

  const keys = [
    ...new Set(data.flatMap((category) => category.values.map((item) => item.label || ''))),
  ]

  const ceilingData: NivoChartDataType = data.map((cat) => {
    const categoryLabel = getCategoryLabel(cat.category, granularity)
    const ceilingDataValue = getCeilingValues(granularity, cat.category, plannedWorkingHours)
    return {
      category: categoryLabel,
      value: ceilingDataValue,
    }
  })

  return { ceilingData, data: chartData, keys }
}
