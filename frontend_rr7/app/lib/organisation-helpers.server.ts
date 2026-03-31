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

import { type ModelsUser } from '~/services/api/lasius'
import {
  getUserProfile,
  type getUserProfileResponse,
} from '~/services/api/lasius/user/user'

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

/**
 * Extract the selected organisation ID from a user profile.
 *
 * Priority: lastSelectedOrganisation > private org > first org > empty string
 */
export function getSelectedOrganisationId(user: ModelsUser): string {
  const organisations = user.organisations ?? []
  return (
    user.settings?.lastSelectedOrganisation?.id ??
    organisations.find((o) => o.private)?.organisationReference.id ??
    organisations[0]?.organisationReference.id ??
    ''
  )
}
