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

import { endOfDay, format, isValid, startOfDay } from 'date-fns'
import { ChevronDown, Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useToast } from '~/components/ui/feedback/use-toast'
import { getAdaptiveGranularity } from '~/lib/api/config/granularity-config'
import { logger } from '~/lib/logger'
import {
  type ExportFormat,
  exportStatistics,
} from '~/lib/utils/statistics-export'
import { type ModelsBookingStats } from '~/services/api/lasius'

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

const apiDateFormat = 'yyyy-MM-dd'

const formatDateParam = (dateStr: string): string => {
  const date = new Date(dateStr)
  if (!isValid(date)) return dateStr
  return format(startOfDay(date), apiDateFormat)
}

const formatDateParamEnd = (dateStr: string): string => {
  const date = new Date(dateStr)
  if (!isValid(date)) return dateStr
  return format(endOfDay(date), apiDateFormat)
}

type FetchStatsParams = {
  from: string
  granularity: string
  scope: 'organisation' | 'user'
  selectedOrgId: string
  source: string
  to: string
}

const fetchAggregatedStats = async ({
  from,
  granularity,
  scope,
  selectedOrgId,
  source,
  to,
}: FetchStatsParams): Promise<ModelsBookingStats[]> => {
  const apiFrom = formatDateParam(from)
  const apiTo = formatDateParamEnd(to)

  const basePath =
    scope === 'organisation'
      ? `/organisation-bookings/organisations/${selectedOrgId}/bookings/stats/aggregated`
      : `/user-bookings/organisations/${selectedOrgId}/bookings/stats/aggregated`

  const params = new URLSearchParams({
    from: apiFrom,
    granularity,
    source,
    to: apiTo,
  })

  const response = await fetch('/api/proxy', {
    body: JSON.stringify({
      method: 'GET',
      url: `${basePath}?${params.toString()}`,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${source} stats: ${response.status}`)
  }

  const data = (await response.json()) as { data?: ModelsBookingStats[] }
  return data.data ?? []
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
  const { addToast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const hasData = bookingList.elements > 0

  const handleExport = async (exportFormat: ExportFormat) => {
    setIsExporting(true)

    try {
      const granularity = getAdaptiveGranularity(from, to)

      const fetchParams = (source: string, gran: string): FetchStatsParams => ({
        from,
        granularity: gran,
        scope,
        selectedOrgId,
        source,
        to,
      })

      let projectsByDay: ModelsBookingStats[] = []
      let tagsByDay: ModelsBookingStats[] = []
      let usersByDay: ModelsBookingStats[] = []
      let projectsAggregated: ModelsBookingStats[] = []
      let tagsAggregated: ModelsBookingStats[] = []
      let usersAggregated: ModelsBookingStats[] = []

      if (scope === 'organisation') {
        ;[
          tagsByDay,
          usersByDay,
          projectsAggregated,
          usersAggregated,
          tagsAggregated,
        ] = await Promise.all([
          fetchAggregatedStats(fetchParams('tag', granularity)),
          fetchAggregatedStats(fetchParams('user', granularity)),
          fetchAggregatedStats(fetchParams('project', 'All')),
          fetchAggregatedStats(fetchParams('user', 'All')),
          fetchAggregatedStats(fetchParams('tag', 'All')),
        ])
      } else {
        ;[projectsByDay, tagsByDay, projectsAggregated, tagsAggregated] =
          await Promise.all([
            fetchAggregatedStats(fetchParams('project', granularity)),
            fetchAggregatedStats(fetchParams('tag', granularity)),
            fetchAggregatedStats(fetchParams('project', 'All')),
            fetchAggregatedStats(fetchParams('tag', 'All')),
          ])
      }

      const byDayAndSource =
        scope === 'organisation'
          ? [
              { data: tagsByDay, source: 'tag' as const },
              { data: usersByDay, source: 'user' as const },
            ]
          : [
              { data: projectsByDay, source: 'project' as const },
              { data: tagsByDay, source: 'tag' as const },
            ]

      const aggregated =
        scope === 'organisation'
          ? [
              { data: projectsAggregated, source: 'project' as const },
              { data: usersAggregated, source: 'user' as const },
              { data: tagsAggregated, source: 'tag' as const },
            ]
          : [
              { data: projectsAggregated, source: 'project' as const },
              { data: tagsAggregated, source: 'tag' as const },
            ]

      exportStatistics(
        {
          aggregated,
          byDayAndSource,
          scope,
          summary: {
            from,
            to,
            totalBookings: bookingList.elements,
            totalHours: bookingList.hours,
            totalProjects: distinctProjects,
            totalUsers: distinctUsers,
          },
        },
        exportFormat,
      )
    } catch (error) {
      logger.error('Failed to export statistics', error)
      addToast({
        message: t('export.stats.error', {
          defaultValue: 'Failed to export statistics. Please try again.',
        }),
        type: 'ERROR',
      })
    } finally {
      setIsExporting(false)
    }
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
        disabled={!hasData || isExporting}
        tabIndex={0}
        type="button"
      >
        {isExporting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
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
