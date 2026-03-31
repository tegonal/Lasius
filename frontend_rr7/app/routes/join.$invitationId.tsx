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

import { useLoaderData } from 'react-router'

import { InvitationInvalid } from '~/features/invitation/components/invitation-invalid'
import { InvitationNeedsAccount } from '~/features/invitation/components/invitation-needs-account'
import { InvitationOtherSession } from '~/features/invitation/components/invitation-other-session'
import { InvitationUserConfirm } from '~/features/invitation/components/invitation-user-confirm'
import { getServerEnv } from '~/lib/env.server'
import { logger } from '~/lib/logger'
import { getDeduplicatedUserProfile } from '~/lib/organisation-helpers.server'
import { getInvitationStatus } from '~/services/api/lasius/invitations-public/invitations-public'
import { type getUserProfileResponse } from '~/services/api/lasius/user/user'
import {
  authHeaders,
  getOptionalUser,
} from '~/services/auth/auth-helpers.server'
import { getEnabledProviders } from '~/services/auth/providers'

import { type Route } from './+types/join.$invitationId'

export default function Join() {
  const { invitation, keycloakName, organisations, providers, userEmail } =
    useLoaderData<typeof loader>()

  if (!invitation) {
    return <InvitationInvalid />
  }

  if (
    invitation.invitation?.id &&
    invitation.invitation?.invitedEmail &&
    !userEmail
  ) {
    return (
      <InvitationNeedsAccount
        invitation={invitation}
        keycloakName={keycloakName}
        providers={providers}
      />
    )
  }

  if (userEmail && userEmail !== invitation.invitation.invitedEmail) {
    return <InvitationOtherSession invitation={invitation} />
  }

  if (userEmail) {
    return (
      <InvitationUserConfirm
        invitation={invitation}
        organisations={organisations}
      />
    )
  }

  return null
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { invitationId } = params

  let invitation = null
  try {
    const result = await getInvitationStatus(invitationId)
    if (result.status === 200) {
      invitation = result.data
    }
  } catch (error) {
    logger.warn('Failed to fetch invitation status', { error, invitationId })
  }

  const auth = await getOptionalUser(request)
  const userEmail = auth?.session.email ?? null

  // Fetch user organisations for the confirm flow (needed for project invitations)
  let organisations: getUserProfileResponse['data']['organisations'] = []
  if (auth) {
    try {
      const profile = await getDeduplicatedUserProfile({
        headers: authHeaders(auth.session),
      })
      organisations = profile.data.organisations
    } catch (error) {
      logger.warn('Failed to fetch user profile for join page', { error })
    }
  }

  const providers = getEnabledProviders()
  const keycloakName = getServerEnv('KEYCLOAK_OAUTH_PROVIDER_NAME')

  return { invitation, keycloakName, organisations, providers, userEmail }
}
