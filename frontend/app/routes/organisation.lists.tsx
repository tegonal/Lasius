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

import { data } from 'react-router'

import { innerGridClasses } from '~/components/ui/layouts/layout-columns'
import { BookingHistoryLayout } from '~/features/booking-history/components/booking-history-layout'
import { loadOrganisationContext } from '~/lib/organisation-helpers.server'
import { getListDateRange } from '~/lib/utils/date/list-date-range'
import { apiTimespanFromTo } from '~/lib/utils/dates'
import { getOrganisationBookingList } from '~/services/api/lasius/organisation-bookings/organisation-bookings'
import { getOrganisationUserList } from '~/services/api/lasius/organisations/organisations'
import { getProjectList } from '~/services/api/lasius/projects/projects'
import { mergeAuthHeaders } from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/organisation.lists'

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const { auth, headers, isOrganisationAdmin, selectedOrgId } = await loadOrganisationContext(
    request,
    url,
  )

  if (!isOrganisationAdmin) {
    throw new Response('Unauthorized', { headers: mergeAuthHeaders(auth), status: 401 })
  }

  const dateRange = getListDateRange(url.searchParams, new Date())
  const timespan = apiTimespanFromTo(dateRange.from, dateRange.to)

  const [bookingsResponse, usersResponse, projectsResponse] = await Promise.all([
    getOrganisationBookingList(selectedOrgId, timespan ?? { from: '', to: '' }, { headers }),
    getOrganisationUserList(selectedOrgId, { headers }),
    getProjectList(selectedOrgId, { headers }),
  ])

  return data(
    {
      bookings: bookingsResponse.data,
      projects: projectsResponse.data.map((p) => ({
        id: p.id,
        key: p.key,
      })),
      users: usersResponse.data,
    },
    { headers: mergeAuthHeaders(auth) },
  )
}

const OrganisationListsPage = ({ loaderData }: Route.ComponentProps) => {
  return (
    <div className={innerGridClasses} data-testid="org-lists-page">
      <BookingHistoryLayout
        bookings={loaderData.bookings}
        dataSource="organisationBookings"
        projects={loaderData.projects}
        users={loaderData.users}
      />
    </div>
  )
}

export default OrganisationListsPage
