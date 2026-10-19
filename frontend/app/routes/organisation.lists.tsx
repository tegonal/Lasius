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
import { type BookingPageQuery } from '~/features/booking-history/hooks/use-booking-pages'
import {
  BOOKING_PAGE_SIZE,
  getBookingListFilter,
  getBookingListSignature,
} from '~/features/booking-history/lib/booking-list-query'
import { getUserClock } from '~/lib/cookies/time-zone-cookie.server'
import { loadOrganisationContext } from '~/lib/organisation-helpers.server'
import { getListDateRange } from '~/lib/utils/date/list-date-range'
import { apiTimespanFromTo } from '~/lib/utils/dates'
import { cachedServerLoader } from '~/lib/utils/loader-cache'
import { getOrganisationBookingPage } from '~/services/api/lasius/organisation-bookings/organisation-bookings'
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

  const clock = getUserClock(request)
  const dateRange = getListDateRange(url.searchParams, clock.now, clock.formatISO)
  const timespan = apiTimespanFromTo(dateRange.from, dateRange.to) ?? { from: '', to: '' }
  const filter = getBookingListFilter(url.searchParams)

  const [pageResponse, usersResponse, projectsResponse] = await Promise.all([
    getOrganisationBookingPage(
      selectedOrgId,
      { ...timespan, ...filter, limit: BOOKING_PAGE_SIZE, skip: 0, withSummary: true },
      { headers },
    ),
    getOrganisationUserList(selectedOrgId, { headers }),
    getProjectList(selectedOrgId, { headers }),
  ])

  const query: BookingPageQuery = {
    dataSource: 'organisationBookings',
    orgId: selectedOrgId,
    ...filter,
    ...timespan,
  }
  return data(
    {
      firstPage: pageResponse.data,
      projects: projectsResponse.data.map((p) => ({
        id: p.id,
        key: p.key,
      })),
      query,
      signature: getBookingListSignature(url.searchParams),
      users: usersResponse.data,
    },
    { headers: mergeAuthHeaders(auth) },
  )
}

const OrganisationListsPage = ({ loaderData }: Route.ComponentProps) => {
  return (
    <div className={innerGridClasses} data-testid="org-lists-page">
      <BookingHistoryLayout
        dataSource="organisationBookings"
        firstPage={loaderData.firstPage}
        projects={loaderData.projects}
        query={loaderData.query}
        signature={loaderData.signature}
        users={loaderData.users}
      />
    </div>
  )
}

export const clientLoader = ({ request, serverLoader }: Route.ClientLoaderArgs) =>
  cachedServerLoader('routes/organisation.lists', request, serverLoader)
clientLoader.hydrate = false

export { listShouldRevalidate as shouldRevalidate } from '~/features/booking-history/lib/booking-list-query'

export default OrganisationListsPage
