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

type ExportFormat = 'ods' | 'xlsx'

type StatsExportProps = {
  bookingList: {
    elements: number
    hours: number
  }
  distinctProjects: number
  distinctUsers: number
  from: string
  scope?: 'organisation' | 'user'
  selectedOrgId: string
  to: string
}

export const StatsExport = ({
  bookingList,
  distinctProjects,
  distinctUsers,
  from,
  scope = 'user',
  selectedOrgId,
  to,
}: StatsExportProps) => {
  const { t } = useTranslation('common')

  const hasData = bookingList.elements > 0

  const handleExport = (exportFormat: ExportFormat) => {
    const params = new URLSearchParams({
      format: exportFormat,
      from,
      orgId: selectedOrgId,
      scope,
      to,
      totalBookings: String(bookingList.elements),
      totalHours: String(bookingList.hours),
      totalProjects: String(distinctProjects),
      totalUsers: String(distinctUsers),
      type: 'statistics',
    })

    window.open(`/api/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="dropdown dropdown-end" data-testid="stats-export">
      <button
        aria-haspopup="menu"
        aria-label={t('export.stats.openMenu', {
          defaultValue: 'Open statistics export format menu',
        })}
        className="btn btn-sm btn-neutral w-auto"
        data-testid="stats-export-btn"
        disabled={!hasData}
        tabIndex={0}
        type="button"
      >
        <Download className="size-4" />
        {t('export.actions.export', { defaultValue: 'Export' })}
        <ChevronDown className="size-4" />
      </button>
      <ul
        aria-label={t('export.stats.menuLabel', {
          defaultValue: 'Statistics export format selection',
        })}
        className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
        role="menu"
        tabIndex={0}
      >
        <li role="none">
          <button
            aria-label={t('export.formats.excelAria', {
              defaultValue: 'Export as Excel file',
            })}
            onClick={() => handleExport('xlsx')}
            role="menuitem"
          >
            {t('export.formats.excel', {
              defaultValue: 'Excel (.xlsx)',
            })}
          </button>
        </li>
        <li role="none">
          <button
            aria-label={t('export.formats.odsAria', {
              defaultValue: 'Export as OpenDocument file',
            })}
            onClick={() => handleExport('ods')}
            role="menuitem"
          >
            {t('export.formats.ods', {
              defaultValue: 'OpenDocument (.ods)',
            })}
          </button>
        </li>
      </ul>
    </div>
  )
}
