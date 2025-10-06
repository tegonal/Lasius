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

import { statsSwrConfig } from 'components/ui/data-display/stats/statsSwrConfig'
import { apiDatespanFromTo, apiTimespanFromTo } from 'lib/api/apiDateHandling'
import { getModelsBookingSummary } from 'lib/api/functions/getModelsBookingSummary'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useGetUserBookingAggregatedStatsByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import { useGetUserBookingListByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import { ExportFormat, exportStatistics } from 'lib/utils/data/statisticsExport'
import { ChevronDown, Download } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { useFormContext } from 'react-hook-form'

export const StatsExport: React.FC = () => {
  const { t } = useTranslation('common')
  const { selectedOrganisationId } = useOrganisation()
  const parentFormContext = useFormContext()

  const from = parentFormContext.watch('from')
  const to = parentFormContext.watch('to')
  const timespan = apiTimespanFromTo(from, to)
  const datespan = apiDatespanFromTo(from, to)

  // Fetch all required data
  const { data: bookingList } = useGetUserBookingListByOrganisation(
    selectedOrganisationId,
    timespan || { from: '', to: '' },
  )

  // Fetch raw API data for export (not transformed for charts)
  const { data: projectsByDay } = useGetUserBookingAggregatedStatsByOrganisation(
    selectedOrganisationId,
    {
      source: 'project',
      from: datespan?.from || '',
      to: datespan?.to || '',
      granularity: 'Day',
    },
    statsSwrConfig,
  )

  const { data: tagsByDay } = useGetUserBookingAggregatedStatsByOrganisation(
    selectedOrganisationId,
    {
      source: 'tag',
      from: datespan?.from || '',
      to: datespan?.to || '',
      granularity: 'Day',
    },
    statsSwrConfig,
  )

  const { data: projectsAggregated } = useGetUserBookingAggregatedStatsByOrganisation(
    selectedOrganisationId,
    {
      source: 'project',
      from: datespan?.from || '',
      to: datespan?.to || '',
      granularity: 'All',
    },
    statsSwrConfig,
  )

  const { data: tagsAggregated } = useGetUserBookingAggregatedStatsByOrganisation(
    selectedOrganisationId,
    {
      source: 'tag',
      from: datespan?.from || '',
      to: datespan?.to || '',
      granularity: 'All',
    },
    statsSwrConfig,
  )

  const hasData =
    bookingList &&
    bookingList.length > 0 &&
    ((projectsByDay?.length ?? 0) > 0 ||
      (tagsByDay?.length ?? 0) > 0 ||
      (projectsAggregated?.length ?? 0) > 0 ||
      (tagsAggregated?.length ?? 0) > 0)

  const handleExport = (format: ExportFormat) => {
    if (!bookingList) return

    const summary = getModelsBookingSummary(bookingList)

    // Calculate distinct users and projects
    const distinctUsers = new Set(
      bookingList.map((item) => item.userReference?.key).filter(Boolean),
    ).size
    const distinctProjects = new Set(
      bookingList.map((item) => item.projectReference?.key).filter(Boolean),
    ).size

    exportStatistics(
      {
        scope: 'user',
        summary: {
          from,
          to,
          totalHours: summary.hours,
          totalBookings: summary.elements,
          totalUsers: distinctUsers,
          totalProjects: distinctProjects,
        },
        byDayAndSource: [
          { source: 'project', data: projectsByDay },
          { source: 'tag', data: tagsByDay },
        ],
        aggregated: [
          { source: 'project', data: projectsAggregated },
          { source: 'tag', data: tagsAggregated },
        ],
      },
      format,
    )
  }

  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        className="btn btn-sm btn-neutral w-auto"
        disabled={!hasData}
        tabIndex={0}
        aria-haspopup="menu"
        aria-label={t('export.stats.openMenu', {
          defaultValue: 'Open statistics export format menu',
        })}>
        <Download className="size-4" />
        {t('export.actions.export', { defaultValue: 'Export' })}
        <ChevronDown className="size-4" />
      </button>
      <ul
        tabIndex={0}
        role="menu"
        aria-label={t('export.stats.menuLabel', {
          defaultValue: 'Statistics export format selection',
        })}
        className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
        <li role="none">
          <button
            role="menuitem"
            onClick={() => handleExport('xlsx')}
            aria-label={t('export.formats.excelAria', {
              defaultValue: 'Export as Excel file',
            })}>
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
