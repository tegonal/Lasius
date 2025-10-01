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

import { modelsLocalDateTimeWithTimeZoneToString } from 'lib/api/apiDateHandling'
import { ExtendedHistoryBooking } from 'types/booking'
import * as XLSX from 'xlsx'

/**
 * Supported export file formats for booking data.
 */
export type ExportFormat = 'csv' | 'xlsx' | 'ods'

/**
 * Exports a list of bookings to CSV, Excel (XLSX), or OpenDocument (ODS) format.
 * Creates a formatted spreadsheet with booking data including user, organization, project,
 * tags, start/end times, and duration.
 *
 * @param bookings - Array of extended history booking records to export
 * @param format - Export format: 'csv', 'xlsx', or 'ods'
 * @param filename - Optional custom filename (defaults to date-stamped name)
 *
 * @example
 * exportBookingList(bookings, 'xlsx', 'my-bookings.xlsx')
 * exportBookingList(bookings, 'csv') // Uses default filename with date
 */
export const exportBookingList = (
  bookings: ExtendedHistoryBooking[],
  format: ExportFormat,
  filename?: string,
) => {
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
  const extension = format
  const bookType = format === 'csv' ? 'csv' : format === 'xlsx' ? 'xlsx' : 'ods'
  const file =
    filename || `lasius-bookings-export-${new Date().toISOString().split('T')[0]}.${extension}`

  // Export the file
  XLSX.writeFile(wb, file, {
    bookType: bookType as XLSX.BookType,
    compression: format !== 'csv', // Use compression for XLSX and ODS
  })
}
