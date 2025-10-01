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

import { exportBookingList, type ExportFormat } from 'lib/utils/data/export'
import { ChevronDown, Download } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { ExtendedHistoryBooking } from 'types/booking'

type Props = {
  bookings: ExtendedHistoryBooking[]
}
export const BookingHistoryExport: React.FC<Props> = ({ bookings }) => {
  const { t } = useTranslation('common')

  const handleExport = (format: ExportFormat) => {
    exportBookingList(bookings, format)
  }

  return (
    <div className="dropdown dropdown-end">
      <button type="button" className="btn btn-neutral" disabled={bookings.length < 1} tabIndex={0}>
        <Download className="size-4" />
        {t('export.actions.export', { defaultValue: 'Export' })}
        <ChevronDown className="size-4" />
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
        <li>
          <button onClick={() => handleExport('csv')}>
            {t('export.formats.csv', { defaultValue: 'CSV (.csv)' })}
          </button>
        </li>
        <li>
          <button onClick={() => handleExport('xlsx')}>
            {t('export.formats.excel', { defaultValue: 'Excel (.xlsx)' })}
          </button>
        </li>
        <li>
          <button onClick={() => handleExport('ods')}>
            {t('export.formats.ods', { defaultValue: 'OpenDocument (.ods)' })}
          </button>
        </li>
      </ul>
    </div>
  )
}
