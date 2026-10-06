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
  for (const stat of stats) {
    for (const v of stat.values) {
      if (v.label) categories.add(v.label)
    }
  }

  return stats.map((stat) => {
    const { category } = stat
    let dateString = ''
    if (category?.day && category.month && category.year) {
      try {
        dateString = formatDate(
          new Date(category.year, category.month - 1, category.day),
          'dd.MM.yyyy',
        )
      } catch {
        dateString = `${category.day}.${category.month}.${category.year}`
      }
    }

    const row: Record<string, number | string> = { Date: dateString }

    let total = 0
    for (const cat of categories) {
      const value = stat.values.find((v) => v.label === cat)
      const hours = value?.duration ? millisToHours(value.duration) : 0
      row[cat] = hours
      total += hours
    }

    row.Total = Math.round(total * 100) / 100
    return row
  })
}

const transformAggregatedData = (stats: ModelsBookingStats[] | undefined) => {
  if (!stats || stats.length === 0 || !stats[0]) return []

  const totalDuration = stats[0].values.reduce(
    (accumulator, v) => accumulator + (v.duration || 0),
    0,
  )

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
    .toSorted((a, b) => b.Hours - a.Hours)
}

const formatSummaryDate = (dateString: string) => {
  try {
    return formatDate(parseISO(dateString), 'dd.MM.yyyy')
  } catch {
    return dateString
  }
}

const summaryRows = (summary: StatisticsExportData['summary']): (number | string)[][] => [
  ['Time Period', `${formatSummaryDate(summary.from)} to ${formatSummaryDate(summary.to)}`],
  ['Total Hours', summary.totalHours],
  ['Total Bookings', summary.totalBookings],
  ...(summary.totalUsers ? [['Total Users', summary.totalUsers]] : []),
  ...(summary.totalProjects ? [['Total Projects', summary.totalProjects]] : []),
]

const appendByDaySheets = (wb: XLSX.WorkBook, sources: StatisticsExportData['byDayAndSource']) => {
  for (const { data: stats, source } of sources) {
    const tableData = transformByDayData(stats)
    if (tableData.length === 0) continue

    const ws = XLSX.utils.json_to_sheet(tableData)
    ws['!cols'] = Object.keys(tableData[0] ?? {}).map((key) => ({
      wch: clamp(key.length, 12, 30),
    }))
    XLSX.utils.book_append_sheet(wb, ws, `By ${capitalize(source)} & Day`.slice(0, 31))
  }
}

const appendAggregatedSheets = (wb: XLSX.WorkBook, sources: StatisticsExportData['aggregated']) => {
  for (const { data: stats, source } of sources) {
    const tableData = transformAggregatedData(stats)
    if (tableData.length === 0) continue

    const ws = XLSX.utils.json_to_sheet(tableData)
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, ws, `${capitalize(source)} Totals`)
  }
}

/**
 * Generates a statistics spreadsheet buffer.
 * Server-only — uses XLSX.write() to return a buffer instead of writing to disk.
 */
export const exportStatistics = (
  data: StatisticsExportData,
  format: ExportFormat,
): { buffer: Uint8Array; filename: string } => {
  const wb = XLSX.utils.book_new()

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows(data.summary))
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

  appendByDaySheets(wb, data.byDayAndSource)
  appendAggregatedSheets(wb, data.aggregated)

  const fromDate = data.summary.from.split('T', 1)[0]
  const toDate = data.summary.to.split('T', 1)[0]
  const filename = `lasius-statistics-${data.scope}-${fromDate}_to_${toDate}.${format}`

  const buffer = XLSX.write(wb, {
    bookType: format,
    compression: true,
    type: 'array',
  }) as Uint8Array

  return { buffer, filename }
}
