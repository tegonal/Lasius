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

import { ChevronDown, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useToast } from '~/components/ui/feedback/use-toast'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import {
  exportBookingList,
  type ExportContext,
  type ExportFormat,
} from '~/lib/utils/data/export'
import { type ExtendedHistoryBooking } from '~/types/booking'

type Props = {
  bookings: ExtendedHistoryBooking[]
  context: ExportContext
  from?: string
  to?: string
}

export const BookingHistoryExport = ({
  bookings,
  context,
  from,
  to,
}: Props) => {
  const { t } = useTranslation('common')
  const { addToast } = useToast()

  const handleExport = (format: ExportFormat) => {
    const filename = exportBookingList(bookings, format, undefined, {
      context,
      from,
      to,
    })
    addToast({
      message: t('export.status.success', 'Export successful: {{filename}}', {
        filename,
      }),
      ttl: 60_000,
      type: 'SUCCESS',
    })
  }

  return (
    <div className="dropdown dropdown-end">
      <button
        aria-haspopup="menu"
        aria-label={t('export.actions.openMenu', 'Open export format menu')}
        className="btn btn-sm btn-neutral w-auto"
        disabled={bookings.length === 0}
        tabIndex={0}
        type="button"
      >
        <LucideIcon icon={Download} size={16} />
        {t('export.actions.export', 'Export')}
        <LucideIcon icon={ChevronDown} size={16} />
      </button>
      <ul
        aria-label={t('export.menu.label', 'Export format selection')}
        className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
        role="menu"
        tabIndex={0}
      >
        <li role="none">
          <button
            aria-label={t('export.formats.csvAria', 'Export as CSV file')}
            onClick={() => handleExport('csv')}
            role="menuitem"
            type="button"
          >
            {t('export.formats.csv', 'CSV (.csv)')}
          </button>
        </li>
        <li role="none">
          <button
            aria-label={t('export.formats.excelAria', 'Export as Excel file')}
            onClick={() => handleExport('xlsx')}
            role="menuitem"
            type="button"
          >
            {t('export.formats.excel', 'Excel (.xlsx)')}
          </button>
        </li>
        <li role="none">
          <button
            aria-label={t(
              'export.formats.odsAria',
              'Export as OpenDocument file',
            )}
            onClick={() => handleExport('ods')}
            role="menuitem"
            type="button"
          >
            {t('export.formats.ods', 'OpenDocument (.ods)')}
          </button>
        </li>
      </ul>
    </div>
  )
}
