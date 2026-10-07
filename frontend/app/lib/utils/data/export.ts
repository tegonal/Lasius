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

import { format as formatDate } from 'date-fns'
import * as XLSX from 'xlsx'

import { getExtendedModelsBookingList } from '~/lib/api/functions/get-extended-models-booking-list'
import { modelsLocalDateTimeWithTimeZoneToString } from '~/lib/utils/dates'
import { type ModelsBooking } from '~/services/api/lasius'

/**
 * Context for export filename generation
 */
export type ExportContext = 'organisation' | 'project' | 'user'

/**
 * Supported export file formats for booking data.
 */
export type ExportFormat = 'csv' | 'ods' | 'xlsx'

/**
 * Options for customizing the export behavior
 */
export type ExportOptions = {
  context?: ExportContext
  contextName?: string
  from?: string
  to?: string
}

const MAX_COLUMN_WIDTH = 50

const datePart = (isoDate: string): string => isoDate.split('T', 1)[0] ?? ''

/**
 * Returns one date for a range inside one calendar day, else `from-to-to`.
 * Without a range, returns today.
 */
const formatFilenameTimespan = (from?: string, to?: string): string => {
  if (!from || !to) return formatDate(new Date(), 'yyyy-MM-dd')
  const fromDate = datePart(from)
  const toDate = datePart(to)
  return fromDate === toDate ? fromDate : `${fromDate}-to-${toDate}`
}

/**
 * Generates a filename for the export based on context and timespan.
 */
export const generateExportFilename = (format: ExportFormat, options?: ExportOptions): string => {
  const parts = [
    'lasius',
    options?.context,
    'bookings',
    options?.contextName,
    formatFilenameTimespan(options?.from, options?.to),
  ].filter(Boolean)

  return `${parts.join('-')}.${format}`
}

/**
 * Returns one column width per key: the longest of the header and every value, plus 2, capped at 50.
 */
export const computeColumnWidths = (rows: Record<string, number | string>[]): { wch: number }[] => {
  const widths = new Map<string, number>()
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      widths.set(key, Math.max(widths.get(key) ?? key.length, String(value).length))
    }
  }
  return Array.from(widths.values(), (width) => ({ wch: Math.min(width + 2, MAX_COLUMN_WIDTH) }))
}

/**
 * Generates a spreadsheet buffer from booking data.
 * Server-only — uses XLSX.write() to return a buffer instead of writing to disk.
 *
 * Accepts raw ModelsBooking[] from the API and computes duration fields internally.
 */
export const exportBookingList = (
  rawBookings: ModelsBooking[],
  format: ExportFormat,
  options?: ExportOptions,
): { buffer: Uint8Array; filename: string } => {
  const bookings = getExtendedModelsBookingList(rawBookings)

  const data = bookings.map((item) => ({
    duration: Math.round(item.duration * 60) / 60 / 24,
    durationString: item.durationString,
    end: item.end ? modelsLocalDateTimeWithTimeZoneToString(item.end) : '',
    organisation: item.organisationReference.key,
    project: item.projectReference.key,
    start: modelsLocalDateTimeWithTimeZoneToString(item.start),
    tags: item.tags.map((tag) => tag.id).join(','),
    user: item.userReference.key,
  }))

  const ws = XLSX.utils.json_to_sheet(data)

  const keys = Object.keys(data[0] || {})
  const durationCol = keys.indexOf('duration')
  if (durationCol !== -1 && ws['!ref']) {
    const range = XLSX.utils.decode_range(ws['!ref'])
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const addr = XLSX.utils.encode_cell({ c: durationCol, r: row })
      const cell = ws[addr]
      if (cell) {
        cell.z = '[h]:mm'
      }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bookings')

  ws['!cols'] = computeColumnWidths(data)

  const filename = generateExportFilename(format, options)

  const buffer = XLSX.write(wb, {
    bookType: format,
    compression: format !== 'csv',
    type: 'array',
  }) as Uint8Array

  return { buffer, filename }
}
