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

import {
  getDeduplicatedUserProfile,
  getSelectedOrganisationId,
} from '~/lib/organisation-helpers.server'
import { dateOptions } from '~/lib/utils/date/date-options'
import { ModelsUserOrganisationRole } from '~/services/api/lasius/modelsUserOrganisationRole'
import { authHeaders, mergeAuthHeaders, requireUser } from '~/services/auth/auth-helpers.server'

/**
 * Shared context for user stats routes.
 * Handles auth, profile, org selection, and date range parsing.
 */
export const loadStatsContext = async (request: Request, url: URL) => {
  const auth = await requireUser(request, url)
  const headers = authHeaders(auth.session)

  const profile = await getDeduplicatedUserProfile({ headers })
  const user = profile.data

  // Determine selected org
  const organisations = user.organisations ?? []
  const selectedOrgId = getSelectedOrganisationId(user)

  // Read date range from URL search params or compute defaults
  let from = url.searchParams.get('from')
  let to = url.searchParams.get('to')

  if (!from || !to) {
    const defaultRange = dateOptions[0]?.dateRangeFn(new Date())
    from = defaultRange?.from ?? ''
    to = defaultRange?.to ?? ''
  }

  return { auth, from, headers, organisations, selectedOrgId, to }
}

/**
 * Shared context for organisation stats routes.
 * Same as loadStatsContext but adds admin role check.
 */
export const loadOrgStatsContext = async (request: Request, url: URL) => {
  const context = await loadStatsContext(request, url)

  const selectedOrg = context.organisations.find(
    (o) => o.organisationReference.id === context.selectedOrgId,
  )
  const isAdmin = selectedOrg?.role === ModelsUserOrganisationRole.OrganisationAdministrator

  if (!isAdmin) {
    throw new Response('Forbidden', { headers: mergeAuthHeaders(context.auth), status: 403 })
  }

  return context
}

/**
 * Return merged auth headers for the stats response.
 */
export const statsResponseHeaders = (auth: Awaited<ReturnType<typeof requireUser>>) =>
  mergeAuthHeaders(auth)
