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
import { getUserBookingPage } from '~/services/api/lasius/user-bookings/user-bookings'
import { mergeAuthHeaders } from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/user.lists'

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const { auth, headers, selectedOrgId } = await loadOrganisationContext(request, url)

  const clock = getUserClock(request)
  const dateRange = getListDateRange(url.searchParams, clock.now, clock.formatISO)
  const timespan = apiTimespanFromTo(dateRange.from, dateRange.to) ?? { from: '', to: '' }
  const { projectId, tagId } = getBookingListFilter(url.searchParams)

  const pageResponse = await getUserBookingPage(
    selectedOrgId,
    { ...timespan, limit: BOOKING_PAGE_SIZE, projectId, skip: 0, tagId, withSummary: true },
    { headers },
  )

  const query: BookingPageQuery = {
    dataSource: 'userBookings',
    orgId: selectedOrgId,
    projectId,
    tagId,
    ...timespan,
  }
  return data(
    {
      firstPage: pageResponse.data,
      query,
      signature: getBookingListSignature(url.searchParams),
    },
    { headers: mergeAuthHeaders(auth) },
  )
}

const UserListsPage = ({ loaderData }: Route.ComponentProps) => {
  return (
    <div className={innerGridClasses} data-testid="lists-page">
      <BookingHistoryLayout
        dataSource="userBookings"
        firstPage={loaderData.firstPage}
        query={loaderData.query}
        signature={loaderData.signature}
      />
    </div>
  )
}

export const clientLoader = ({ request, serverLoader }: Route.ClientLoaderArgs) =>
  cachedServerLoader('routes/user.lists', request, serverLoader)
clientLoader.hydrate = false

export { listShouldRevalidate as shouldRevalidate } from '~/features/booking-history/lib/booking-list-query'

export default UserListsPage
