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

/**
 * Generates a filename for the export based on context and timespan.
 */
const generateExportFilename = (
  format: ExportFormat,
  options?: ExportOptions,
): string => {
  const parts = ['lasius']

  if (options?.context) {
    parts.push(options.context)
  }

  parts.push('bookings')

  if (options?.contextName) {
    parts.push(options.contextName)
  }

  if (options?.from && options?.to) {
    const daysDiff = differenceInDays(
      parseISO(options.to),
      parseISO(options.from),
    )
    if (daysDiff > 1) {
      const fromDate = options.from.split('T')[0]
      const toDate = options.to.split('T')[0]
      parts.push(`${fromDate}-to-${toDate}`)
    } else {
      const date = options.from.split('T')[0] ?? ''
      parts.push(date)
    }
  } else {
    parts.push(new Date().toISOString().split('T')[0] ?? '')
  }

  return `${parts.join('-')}.${format}`
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
      if (ws[addr]) {
        ws[addr].z = '[h]:mm'
      }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bookings')

  const init: Record<string, number> = {}
  const maxLengths = data.reduce((acc, row) => {
    for (const key of Object.keys(row)) {
      const value = String(row[key as keyof typeof row] || '')
      acc[key] = Math.max(
        (acc[key] ?? 0) > 0 ? (acc[key] ?? 0) : key.length,
        value.length,
      )
    }
    return acc
  }, init)

  ws['!cols'] = Object.keys(maxLengths).map((key) => ({
    wch: Math.min((maxLengths[key] ?? 0) + 2, 50),
  }))

  const bookTypeMap: Record<string, string> = { csv: 'csv', xlsx: 'xlsx' }
  const bookType = bookTypeMap[format] ?? 'ods'
  const filename = generateExportFilename(format, options)

  const buffer = XLSX.write(wb, {
    bookType: bookType as XLSX.BookType,
    compression: format !== 'csv',
    type: 'array',
  }) as Uint8Array

  return { buffer, filename }
}
