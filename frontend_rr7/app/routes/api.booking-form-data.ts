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

import { subDays } from 'date-fns'
import { data } from 'react-router'

import { formatISOLocale } from '~/lib/utils/dates'
import { getOrganisationBookingList } from '~/services/api/lasius/organisation-bookings/organisation-bookings'
import { getUserBookingListByOrganisation } from '~/services/api/lasius/user-bookings/user-bookings'
import { getFavoriteBookingList } from '~/services/api/lasius/user-favorites/user-favorites'
import { getTagsByProject } from '~/services/api/lasius/user-organisations/user-organisations'
import { getUserProfile } from '~/services/api/lasius/user/user'
import {
  authHeaders,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

/**
 * GET /api/booking-form-data?orgId=xxx&projectId=xxx
 *
 * Resource route loader that fetches data needed for booking add/edit forms.
 * Returns projects, favorites, recent bookings, org bookings, and project tags.
 * Called by booking modal components via useFetcher.load().
 */
export async function loader({ request }: { request: Request }) {
  const auth = await requireUser(request)
  const headers = authHeaders(auth.session)
  const url = new URL(request.url)
  const orgId = url.searchParams.get('orgId')
  const projectId = url.searchParams.get('projectId')

  if (!orgId) {
    return data(
      {
        favorites: null,
        orgBookings: [],
        projects: [],
        projectTags: [],
        recentBookings: [],
      },
      { headers: mergeAuthHeaders(auth), status: 400 },
    )
  }

  const now = new Date()
  const sevenDaysAgo = subDays(now, 7)
  const timespan = {
    from: formatISOLocale(sevenDaysAgo),
    to: formatISOLocale(now),
  }

  // Fetch all data in parallel
  const [profileRes, favoritesRes, recentBookingsRes, orgBookingsRes] =
    await Promise.all([
      getUserProfile({ headers }),
      getFavoriteBookingList(orgId, { headers }),
      getUserBookingListByOrganisation(orgId, timespan, { headers }),
      getOrganisationBookingList(orgId, timespan, { headers }),
    ])

  // Extract projects for the selected org, sorted by key
  const organisations = profileRes.data.organisations ?? []
  const selectedOrg = organisations.find(
    (o) => o.organisationReference.id === orgId,
  )
  const projects = (selectedOrg?.projects ?? [])
    .map((p) => p.projectReference)
    .slice()
    .sort((a, b) => a.key.localeCompare(b.key))

  // Conditionally fetch tags for the selected project
  let projectTags: Awaited<ReturnType<typeof getTagsByProject>>['data'] = []
  if (projectId) {
    const tagsRes = await getTagsByProject(orgId, projectId, { headers })
    projectTags = tagsRes.data
  }

  return data(
    {
      favorites: favoritesRes.data,
      orgBookings: orgBookingsRes.data,
      projects,
      projectTags,
      recentBookings: recentBookingsRes.data,
    },
    { headers: mergeAuthHeaders(auth) },
  )
}
