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

import { getUserBookingListByOrganisation } from '~/services/api/lasius/user-bookings/user-bookings'
import {
  authHeaders,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

/**
 * GET /api/calendar-bookings?orgId=xxx&from=xxx&to=xxx
 *
 * Resource route loader that fetches booking data for a date range.
 * Called by CalendarDataProvider via useFetcher.load().
 */
export async function loader({ request }: { request: Request }) {
  const auth = await requireUser(request)
  const url = new URL(request.url)
  const orgId = url.searchParams.get('orgId')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  if (!orgId || !from || !to) {
    return data(
      { bookings: [] },
      { headers: mergeAuthHeaders(auth), status: 400 },
    )
  }

  const result = await getUserBookingListByOrganisation(
    orgId,
    { from, to },
    { headers: authHeaders(auth.session) },
  )

  return data({ bookings: result.data }, { headers: mergeAuthHeaders(auth) })
}
