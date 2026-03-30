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

import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { type ExportContext, type ExportFormat } from '~/lib/utils/data/export'

type Props = {
  context: ExportContext
  from?: string
  hasBookings: boolean
  projectId?: string
  tags?: string
  to?: string
  userId?: string
}

export const BookingHistoryExport = ({
  context,
  from,
  hasBookings,
  projectId,
  tags,
  to,
  userId,
}: Props) => {
  const { t } = useTranslation('common')
  const { selectedOrganisationId } = useOrganisation()

  const handleExport = (format: ExportFormat) => {
    const params = new URLSearchParams({
      context,
      format,
      orgId: selectedOrganisationId,
      type: 'bookings',
    })
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (projectId) params.set('projectId', projectId)
    if (userId) params.set('userId', userId)
    if (tags) params.set('tags', tags)

    window.open(`/api/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="dropdown dropdown-end">
      <button
        aria-haspopup="menu"
        aria-label={t('export.actions.openMenu', 'Open export format menu')}
        className="btn btn-sm btn-neutral w-auto"
        disabled={!hasBookings}
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
