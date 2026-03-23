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
import { capitalize, clamp } from 'es-toolkit'
import * as XLSX from 'xlsx'

import { type ModelsBookingStats } from '~/services/api/lasius'

import { millisToHours } from './dates'

export type ExportFormat = 'ods' | 'xlsx'

export type StatisticsExportData = {
  aggregated: {
    data: ModelsBookingStats[] | undefined
    source: string
  }[]
  byDayAndSource: {
    data: ModelsBookingStats[] | undefined
    source: string
  }[]
  scope: 'organisation' | 'user'
  summary: {
    from: string
    to: string
    totalBookings: number
    totalHours: number
    totalProjects?: number
    totalUsers?: number
  }
}

const transformByDayData = (stats: ModelsBookingStats[] | undefined) => {
  if (!stats || !Array.isArray(stats) || stats.length === 0) return []

  const categories = new Set<string>()
  stats.forEach((stat) => {
    stat.values.forEach((v) => {
      if (v.label) categories.add(v.label)
    })
  })

  return stats.map((stat) => {
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
    }

    const row: Record<string, number | string> = { Date: dateStr }

    let total = 0
    categories.forEach((cat) => {
      const value = stat.values.find((v) => v.label === cat)
      const hours = value?.duration ? millisToHours(value.duration) : 0
      row[cat] = hours
      total += hours
    })

    row.Total = Math.round(total * 100) / 100
    return row
  })
}

const transformAggregatedData = (stats: ModelsBookingStats[] | undefined) => {
  if (!stats || stats.length === 0 || !stats[0]) return []

  const totalDuration = stats[0].values.reduce(
    (acc, v) => acc + (v.duration || 0),
    0,
  )

  return stats[0].values
    .map((item) => {
      const hours = item.duration ? millisToHours(item.duration) : 0
      const percentage =
        totalDuration > 0 ? ((item.duration || 0) / totalDuration) * 100 : 0
      return {
        Category: item.label || '',
        Hours: Math.round(hours * 100) / 100,
        Percentage: `${percentage.toFixed(2)}%`,
      }
    })
    .filter((item) => item.Hours > 0)
    .sort((a, b) => b.Hours - a.Hours)
}

export const exportStatistics = (
  data: StatisticsExportData,
  format: ExportFormat,
  filename?: string,
) => {
  const wb = XLSX.utils.book_new()

  const formatSummaryDate = (dateStr: string) => {
    try {
      return formatDate(parseISO(dateStr), 'dd.MM.yyyy')
    } catch {
      return dateStr
    }
  }

  const summaryData: (number | string)[][] = [
    [
      'Time Period',
      `${formatSummaryDate(data.summary.from)} to ${formatSummaryDate(data.summary.to)}`,
    ],
    ['Total Hours', data.summary.totalHours],
    ['Total Bookings', data.summary.totalBookings],
  ]

  if (data.summary.totalUsers !== undefined && data.summary.totalUsers > 0) {
    summaryData.push(['Total Users', data.summary.totalUsers])
  }
  if (
    data.summary.totalProjects !== undefined &&
    data.summary.totalProjects > 0
  ) {
    summaryData.push(['Total Projects', data.summary.totalProjects])
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

  data.byDayAndSource.forEach(({ data: stats, source }) => {
    if (!stats || stats.length === 0) return

    const tableData = transformByDayData(stats)
    if (tableData.length === 0) return

    const ws = XLSX.utils.json_to_sheet(tableData)

    const colWidths = Object.keys(tableData[0] || {}).map((key) => ({
      wch: clamp(key.length, 12, 30),
    }))
    ws['!cols'] = colWidths

    const sheetName = `By ${capitalize(source)} & Day`
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31))
  })

  data.aggregated.forEach(({ data: stats, source }) => {
    if (!stats || stats.length === 0) return

    const tableData = transformAggregatedData(stats)
    if (tableData.length === 0) return

    const ws = XLSX.utils.json_to_sheet(tableData)
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }]

    const sheetName = `${capitalize(source)} Totals`
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  })

  const extension = format
  const fromDate = data.summary.from.split('T')[0]
  const toDate = data.summary.to.split('T')[0]
  const file =
    filename ||
    `lasius-statistics-${data.scope}-${fromDate}_to_${toDate}.${extension}`

  XLSX.writeFile(wb, file, {
    bookType: format as XLSX.BookType,
    compression: true,
  })
}
