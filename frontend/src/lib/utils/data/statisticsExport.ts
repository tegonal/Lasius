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

import { format as formatDate, parseISO } from 'date-fns'
import { ModelsBookingStats } from 'lib/api/lasius'
import { millisToHours } from 'lib/utils/date/dates'
import * as XLSX from 'xlsx'

/**
 * Supported export file formats for statistics data.
 */
export type ExportFormat = 'xlsx' | 'ods'

/**
 * Structure for statistics export data including summary, daily breakdowns, and aggregated totals.
 * Used for generating multi-sheet spreadsheet exports with comprehensive time tracking statistics.
 */
export type StatisticsExportData = {
  /** Scope of the statistics: 'user' for individual user stats, 'organisation' for team/org stats */
  scope: 'user' | 'organisation'
  /** Summary information for the report period */
  summary: {
    /** Start date of the reporting period (ISO string) */
    from: string
    /** End date of the reporting period (ISO string) */
    to: string
    /** Total hours tracked in the period */
    totalHours: number
    /** Total number of bookings/entries */
    totalBookings: number
    /** Total number of users (organisation scope only) */
    totalUsers?: number
    /** Total number of projects (organisation scope only) */
    totalProjects?: number
  }
  /** Daily breakdown by source (project, tag, or user) */
  byDayAndSource: {
    /** Type of source: 'project', 'tag', or 'user' */
    source: string
    /** Statistics data broken down by day */
    data: ModelsBookingStats[] | undefined
  }[]
  /** Aggregated totals by source (project, tag, or user) */
  aggregated: {
    /** Type of source: 'project', 'tag', or 'user' */
    source: string
    /** Aggregated statistics data */
    data: ModelsBookingStats[] | undefined
  }[]
}

/**
 * Transform stats data by day and source into table format
 * Returns array of rows with Date column + dynamic source columns
 */
const transformByDayData = (stats: ModelsBookingStats[] | undefined) => {
  if (!stats || !Array.isArray(stats) || stats.length === 0) return []

  // Get all unique categories (projects/tags/users)
  const categories = new Set<string>()
  stats.forEach((stat) => {
    stat.values.forEach((v) => {
      if (v.label) categories.add(v.label)
    })
  })

  // Build table rows
  return stats.map((stat) => {
    // Format date from category data
    const { category } = stat
    let dateStr = ''
    if (category?.day && category?.month && category?.year) {
      try {
        dateStr = formatDate(
          new Date(category.year, category.month - 1, category.day),
          'dd.MM.yyyy',
        )
      } catch {
        dateStr = `${category.day}.${category.month}.${category.year}`
      }
    } else if ((stat as any).date) {
      try {
        dateStr = formatDate(parseISO((stat as any).date), 'dd.MM.yyyy')
      } catch {
        dateStr = (stat as any).date
      }
    }

    const row: Record<string, string | number> = { Date: dateStr }

    let total = 0
    categories.forEach((category) => {
      const value = stat.values.find((v) => v.label === category)
      const hours = value?.duration ? millisToHours(value.duration) : 0
      row[category] = hours
      total += hours
    })

    row.Total = Math.round(total * 100) / 100
    return row
  })
}

/**
 * Transform aggregated stats into table format
 * Returns array of rows with Category, Hours, Percentage columns
 */
const transformAggregatedData = (stats: ModelsBookingStats[] | undefined) => {
  if (!stats || stats.length === 0 || !stats[0]) return []

  const totalDuration = stats[0].values.reduce((acc, v) => acc + (v.duration || 0), 0)

  return stats[0].values
    .map((item) => {
      const hours = item.duration ? millisToHours(item.duration) : 0
      const percentage = totalDuration > 0 ? ((item.duration || 0) / totalDuration) * 100 : 0
      return {
        Category: item.label || '',
        Hours: Math.round(hours * 100) / 100,
        Percentage: `${percentage.toFixed(2)}%`,
      }
    })
    .filter((item) => item.Hours > 0)
    .sort((a, b) => b.Hours - a.Hours)
}

/**
 * Exports statistics data to Excel (XLSX) or OpenDocument (ODS) format with multiple sheets.
 * Generates a comprehensive report with:
 * - Summary sheet with key metrics and date range
 * - Daily breakdown sheets by project/tag/user
 * - Aggregated totals sheets showing overall distribution
 *
 * @param data - Statistics export data structure containing all report information
 * @param format - Export format: 'xlsx' or 'ods'
 * @param filename - Optional custom filename (defaults to date-stamped name based on scope)
 *
 * @example
 * exportStatistics(statsData, 'xlsx', 'team-report.xlsx')
 * exportStatistics(userStats, 'ods') // Uses default filename with date range
 */
export const exportStatistics = (
  data: StatisticsExportData,
  format: ExportFormat,
  filename?: string,
) => {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Summary
  const formatSummaryDate = (dateStr: string) => {
    try {
      return formatDate(parseISO(dateStr), 'dd.MM.yyyy')
    } catch (error) {
      console.error('Date formatting error:', error, 'for date:', dateStr)
      return dateStr
    }
  }

  const summaryData = [
    [
      'Time Period',
      `${formatSummaryDate(data.summary.from)} to ${formatSummaryDate(data.summary.to)}`,
    ],
    ['Total Hours', data.summary.totalHours],
    ['Total Bookings', data.summary.totalBookings],
  ]

  // Add users and projects count if available
  if (data.summary.totalUsers !== undefined && data.summary.totalUsers > 0) {
    summaryData.push(['Total Users', data.summary.totalUsers])
  }
  if (data.summary.totalProjects !== undefined && data.summary.totalProjects > 0) {
    summaryData.push(['Total Projects', data.summary.totalProjects])
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

  // Sheets 2-N: By Day and Source (Projects, Tags, Users)
  data.byDayAndSource.forEach(({ source, data: stats }) => {
    if (!stats || stats.length === 0) return

    const tableData = transformByDayData(stats)
    if (tableData.length === 0) return

    const ws = XLSX.utils.json_to_sheet(tableData)

    // Auto-size columns
    const colWidths = Object.keys(tableData[0] || {}).map((key) => ({
      wch: Math.min(Math.max(key.length, 12), 30),
    }))
    ws['!cols'] = colWidths

    const sheetName = `By ${source.charAt(0).toUpperCase() + source.slice(1)} & Day`
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)) // Excel has 31 char limit
  })

  // Sheets N+1-M: Aggregated Totals
  data.aggregated.forEach(({ source, data: stats }) => {
    if (!stats || stats.length === 0) return

    const tableData = transformAggregatedData(stats)
    if (tableData.length === 0) return

    const ws = XLSX.utils.json_to_sheet(tableData)
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }]

    const sheetName = `${source.charAt(0).toUpperCase() + source.slice(1)} Totals`
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  })

  // Generate filename with scope and date range
  const extension = format
  const fromDate = data.summary.from.split('T')[0]
  const toDate = data.summary.to.split('T')[0]
  const file = filename || `lasius-statistics-${data.scope}-${fromDate}_to_${toDate}.${extension}`

  // Export the file
  XLSX.writeFile(wb, file, {
    bookType: format as XLSX.BookType,
    compression: true,
  })
}
