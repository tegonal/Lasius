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

import { selectOrganisation } from '~/lib/organisation-selection'
import { type ModelsUser } from '~/services/api/lasius'
import { ModelsUserOrganisationRole } from '~/services/api/lasius/modelsUserOrganisationRole'
import { getUserProfile, type getUserProfileResponse } from '~/services/api/lasius/user/user'
import { authHeaders, requireUser } from '~/services/auth/auth-helpers.server'

/**
 * In-flight deduplication for getUserProfile.
 *
 * React Router runs parent + child loaders in parallel. Multiple loaders calling
 * getUserProfile with the same auth headers would fire duplicate backend requests.
 * This map ensures only one request is in-flight per access token — all concurrent
 * callers share the same promise.
 *
 * Same pattern as `inflightRefreshes` in session.server.ts.
 */
const inflightProfiles = new Map<string, Promise<getUserProfileResponse>>()

export async function getDeduplicatedUserProfile(options: {
  headers: Record<string, string>
}): Promise<getUserProfileResponse> {
  const accessToken = options.headers['Authorization'] ?? ''
  const inflight = inflightProfiles.get(accessToken)
  if (inflight) {
    return inflight
  }

  const promise = getUserProfile(options)
  inflightProfiles.set(accessToken, promise)

  try {
    return await promise
  } finally {
    inflightProfiles.delete(accessToken)
  }
}

/** The id of the organisation that `selectOrganisation` picks, or an empty string. */
export function getSelectedOrganisationId(user: ModelsUser): string {
  return selectOrganisation(user)?.organisationReference.id ?? ''
}

/**
 * The common start of a loader: the signed-in user, the auth headers for API calls, and the
 * selected organisation with the role of the user in it.
 */
export async function loadOrganisationContext(request: Request, url: URL) {
  const auth = await requireUser(request, url)
  const headers = authHeaders(auth.session)

  const profile = await getDeduplicatedUserProfile({ headers })
  const user = profile.data
  const selectedOrgId = getSelectedOrganisationId(user)
  const selectedOrg = (user.organisations ?? []).find(
    (o) => o.organisationReference.id === selectedOrgId,
  )

  return {
    auth,
    headers,
    isOrganisationAdmin: selectedOrg?.role === ModelsUserOrganisationRole.OrganisationAdministrator,
    selectedOrg,
    selectedOrgId,
    user,
  }
}
