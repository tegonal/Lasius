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

import { differenceInDays, parseISO } from 'date-fns'
import { modelsLocalDateTimeWithTimeZoneToString } from 'lib/api/apiDateHandling'
import { ExtendedHistoryBooking } from 'types/booking'
import * as XLSX from 'xlsx'

/**
 * Supported export file formats for booking data.
 */
export type ExportFormat = 'csv' | 'xlsx' | 'ods'

/**
 * Context for export filename generation
 */
export type ExportContext = 'user' | 'organisation' | 'project'

/**
 * Options for customizing the export behavior
 */
export type ExportOptions = {
  context?: ExportContext
  contextName?: string
  from?: string
  to?: string
}

/**
 * Generates a filename for the export based on context and timespan.
 *
 * @param format - Export format extension
 * @param options - Export options including context and timespan
 * @returns Generated filename
 *
 * @example
 * generateExportFilename('xlsx', { context: 'user', from: '2025-01-01', to: '2025-01-31' })
 * // Returns: 'lasius-user-bookings-2025-01-01-to-2025-01-31.xlsx'
 */
const generateExportFilename = (format: ExportFormat, options?: ExportOptions): string => {
  const parts = ['lasius']

  if (options?.context) {
    parts.push(options.context)
  }

  parts.push('bookings')

  if (options?.contextName) {
    parts.push(options.contextName)
  }

  // Add timespan if dates are provided and span more than 1 day
  if (options?.from && options?.to) {
    const daysDiff = differenceInDays(parseISO(options.to), parseISO(options.from))
    if (daysDiff > 1) {
      const fromDate = options.from.split('T')[0]
      const toDate = options.to.split('T')[0]
      parts.push(`${fromDate}-to-${toDate}`)
    } else {
      // Single day export
      const date = options.from.split('T')[0]
      parts.push(date)
    }
  } else {
    // No dates provided, use current date
    parts.push(new Date().toISOString().split('T')[0])
  }

  return `${parts.join('-')}.${format}`
}

/**
 * Exports a list of bookings to CSV, Excel (XLSX), or OpenDocument (ODS) format.
 * Creates a formatted spreadsheet with booking data including user, organization, project,
 * tags, start/end times, and duration.
 *
 * @param bookings - Array of extended history booking records to export
 * @param format - Export format: 'csv', 'xlsx', or 'ods'
 * @param filename - Optional custom filename (defaults to context-based name)
 * @param options - Optional export options for context and timespan
 * @returns The filename of the exported file
 *
 * @example
 * const filename = exportBookingList(bookings, 'xlsx', undefined, { context: 'user', from: '2025-01-01', to: '2025-01-31' })
 * exportBookingList(bookings, 'csv') // Uses default filename
 */
export const exportBookingList = (
  bookings: ExtendedHistoryBooking[],
  format: ExportFormat,
  filename?: string,
  options?: ExportOptions,
): string => {
  // Transform data - same logic as old CSV export
  const data = bookings.map((item) => ({
    user: item.userReference.key,
    organisation: item.organisationReference.key,
    project: item.projectReference.key,
    tags: item.tags.map((tag) => tag.id).join(','),
    start: modelsLocalDateTimeWithTimeZoneToString(item.start),
    end: item.end ? modelsLocalDateTimeWithTimeZoneToString(item.end) : '',
    duration: item.duration.toString(),
    durationString: item.durationString,
  }))

  // Create worksheet from JSON data
  const ws = XLSX.utils.json_to_sheet(data)

  // Create workbook and add the worksheet
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bookings')

  // Set column widths for better readability
  const maxLengths = data.reduce(
    (acc, row) => {
      Object.keys(row).forEach((key) => {
        const value = String(row[key as keyof typeof row] || '')
        acc[key] = Math.max(acc[key] || key.length, value.length)
      })
      return acc
    },
    {} as Record<string, number>,
  )

  ws['!cols'] = Object.keys(maxLengths).map((key) => ({
    wch: Math.min(maxLengths[key] + 2, 50), // Add padding, cap at 50
  }))

  // Determine file extension and bookType based on format
  const bookType = format === 'csv' ? 'csv' : format === 'xlsx' ? 'xlsx' : 'ods'
  const file = filename || generateExportFilename(format, options)

  // Export the file
  XLSX.writeFile(wb, file, {
    bookType: bookType as XLSX.BookType,
    compression: format !== 'csv', // Use compression for XLSX and ODS
  })

  return file
}
