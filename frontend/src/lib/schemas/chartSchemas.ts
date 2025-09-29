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

import { logger } from 'lib/logger'
import { z } from 'zod'

// ============= Monthly Week Stream Chart Schemas =============
// This chart displays weekly hours distribution across days for a month
// Data structure matches Nivo's expected format: array of objects where each object
// represents a time point (weekday) with properties for each series (weeks)

// Monthly stream chart data item - each item represents a weekday with week values
// Structure: { "Week 40": 8.5, "Week 41": 7.2, "Week 42": 0, ... }
export const monthlyWeekStreamDataItemSchema = z.record(
  z.string().regex(/^Week \d+$/), // Keys must be "Week X" format
  z.number().min(0), // Values must be non-negative numbers (hours)
)

// Array of monthly stream data items (7 items, one per weekday)
// Each item has the same week keys but different values
export const monthlyWeekStreamDataSchema = z.array(monthlyWeekStreamDataItemSchema).length(7)

// Monthly stream chart keys schema - array of week labels that exist as properties in data
// These are the series/layers for the stream chart
export const monthlyWeekStreamKeysSchema = z.array(
  z.string().regex(/^Week \d+$/), // Each key must be "Week X" format
)

// Complete monthly week stream chart data structure returned by the hook
export const monthlyWeekStreamChartDataSchema = z.object({
  data: monthlyWeekStreamDataSchema,
  keys: monthlyWeekStreamKeysSchema,
  isLoading: z.boolean(),
  hasData: z.boolean(),
})

// Type exports for Monthly Week Stream Chart
export type MonthlyWeekStreamDataItem = z.infer<typeof monthlyWeekStreamDataItemSchema>
export type MonthlyWeekStreamData = z.infer<typeof monthlyWeekStreamDataSchema>
export type MonthlyWeekStreamKeys = z.infer<typeof monthlyWeekStreamKeysSchema>
export type MonthlyWeekStreamChartData = z.infer<typeof monthlyWeekStreamChartDataSchema>

// Validation helper for monthly week stream chart with detailed error messages
export function validateMonthlyWeekStreamChartData(data: unknown): MonthlyWeekStreamChartData {
  try {
    return monthlyWeekStreamChartDataSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[ChartSchemas] Monthly week stream chart data validation failed:', error.issues)
      throw new Error(
        `Invalid monthly week stream chart data: ${error.issues.map((e: any) => e.message).join(', ')}`,
      )
    }
    throw error
  }
}

// Type guard for monthly week stream data
export function isValidMonthlyWeekStreamData(data: unknown): data is MonthlyWeekStreamData {
  try {
    monthlyWeekStreamDataSchema.parse(data)
    return true
  } catch {
    return false
  }
}
