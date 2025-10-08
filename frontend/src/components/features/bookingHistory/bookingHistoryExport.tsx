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

import { useToast } from 'components/ui/feedback/hooks/useToast'
import { exportBookingList, type ExportContext, type ExportFormat } from 'lib/utils/data/export'
import { ChevronDown, Download } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { ExtendedHistoryBooking } from 'types/booking'

type Props = {
  bookings: ExtendedHistoryBooking[]
  context: ExportContext
  from?: string
  to?: string
}
export const BookingHistoryExport: React.FC<Props> = ({ bookings, context, from, to }) => {
  const { t } = useTranslation('common')
  const { addToast } = useToast()

  const handleExport = (format: ExportFormat) => {
    const filename = exportBookingList(bookings, format, undefined, { context, from, to })
    addToast({
      message: t('export.status.success', {
        defaultValue: 'Export successful: {{filename}}',
        filename,
      }),
      type: 'SUCCESS',
      ttl: 60000,
    })
  }

  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        className="btn btn-sm btn-neutral w-auto"
        disabled={bookings.length < 1}
        tabIndex={0}
        aria-haspopup="menu"
        aria-label={t('export.actions.openMenu', {
          defaultValue: 'Open export format menu',
        })}>
        <Download className="size-4" />
        {t('export.actions.export', { defaultValue: 'Export' })}
        <ChevronDown className="size-4" />
      </button>
      <ul
        tabIndex={0}
        role="menu"
        aria-label={t('export.menu.label', { defaultValue: 'Export format selection' })}
        className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
        <li role="none">
          <button
            role="menuitem"
            onClick={() => handleExport('csv')}
            aria-label={t('export.formats.csvAria', { defaultValue: 'Export as CSV file' })}>
            {t('export.formats.csv', { defaultValue: 'CSV (.csv)' })}
          </button>
        </li>
        <li role="none">
          <button
            role="menuitem"
            onClick={() => handleExport('xlsx')}
            aria-label={t('export.formats.excelAria', { defaultValue: 'Export as Excel file' })}>
            {t('export.formats.excel', { defaultValue: 'Excel (.xlsx)' })}
          </button>
        </li>
        <li role="none">
          <button
            role="menuitem"
            onClick={() => handleExport('ods')}
            aria-label={t('export.formats.odsAria', {
              defaultValue: 'Export as OpenDocument file',
            })}>
            {t('export.formats.ods', { defaultValue: 'OpenDocument (.ods)' })}
          </button>
        </li>
      </ul>
    </div>
  )
}
