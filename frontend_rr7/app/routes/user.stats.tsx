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

import { useTranslation } from 'react-i18next'
import { data, href, Outlet } from 'react-router'

import {
  ColumnCenter,
  ColumnRight,
  innerGridClasses,
} from '~/components/ui/layouts/layout-columns'
import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { StatsExport } from '~/features/stats/components/stats-export'
import { StatsFilter } from '~/features/stats/components/stats-filter'
import { StatsOverview } from '~/features/stats/components/stats-overview'
import { StatsTabs } from '~/features/stats/components/stats-tabs'
import {
  loadStatsContext,
  statsResponseHeaders,
} from '~/features/stats/stats-loader.server'
import { getModelsBookingSummary } from '~/lib/api/functions/get-models-booking-summary'
import { apiTimespanFromTo } from '~/lib/utils/dates'
import { getUserBookingListByOrganisation } from '~/services/api/lasius/user-bookings/user-bookings'

import { type Route } from './+types/user.stats'

// ─── Revalidation ────────────────────────────────────────────────────────────

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = async ({ request }: Route.LoaderArgs) => {
  const ctx = await loadStatsContext(request)
  const { from, headers, selectedOrgId, to } = ctx

  // Compute API params
  const timespan = apiTimespanFromTo(from, to)

  // Fetch bookings for overview summary
  const bookingsRes = timespan
    ? await getUserBookingListByOrganisation(selectedOrgId, timespan, {
        headers,
      })
    : { data: [] }

  const bookings = bookingsRes.data ?? []

  // Transform data server-side
  const bookingSummary = getModelsBookingSummary(bookings)

  const distinctUsers = new Set(
    bookings.map((b) => b.userReference?.id).filter(Boolean),
  ).size
  const distinctProjects = new Set(
    bookings.map((b) => b.projectReference?.id).filter(Boolean),
  ).size

  return data(
    {
      bookingSummary,
      distinctProjects,
      distinctUsers,
      from,
      selectedOrgId,
      to,
    },
    { headers: statsResponseHeaders(ctx.auth) },
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

const UserStatsLayout = ({ loaderData }: Route.ComponentProps) => {
  const { t } = useTranslation()

  const {
    bookingSummary,
    distinctProjects,
    distinctUsers,
    from,
    selectedOrgId,
    to,
  } = loaderData

  const tabs = [
    {
      id: 'projects',
      label: t('projects:title', 'Projects'),
      to: href('/user/stats/projects'),
    },
    {
      id: 'tags',
      label: t('tag-manager:title', 'Tags'),
      to: href('/user/stats/tags'),
    },
  ]

  return (
    <div className={innerGridClasses} data-testid="stats-page">
      <ColumnCenter>
        <div className="flex h-full flex-col overflow-hidden">
          <div className="bg-base-200 flex-shrink-0 px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <StatsOverview
                  distinctProjects={distinctProjects}
                  distinctUsers={distinctUsers}
                  elements={bookingSummary.elements}
                  hours={bookingSummary.hours}
                />
              </div>
              <div className="flex-shrink-0">
                <StatsExport
                  bookingList={bookingSummary}
                  distinctProjects={distinctProjects}
                  distinctUsers={distinctUsers}
                  from={from}
                  selectedOrgId={selectedOrgId}
                  to={to}
                />
              </div>
            </div>
          </div>
          <div className="border-base-200 border-b px-6 pt-2">
            <StatsTabs tabs={tabs} />
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="pt-4">
              <Outlet />
            </div>
          </ScrollArea>
        </div>
      </ColumnCenter>
      <ColumnRight>
        <ScrollArea className="h-full">
          <div className="p-4">
            <StatsFilter />
          </div>
        </ScrollArea>
      </ColumnRight>
    </div>
  )
}

export default UserStatsLayout

export { statsShouldRevalidate as shouldRevalidate } from '~/features/stats/stats-loader'
