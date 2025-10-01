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

import { InvitationInvalid } from 'components/features/invitation/invitationInvalid'
import { InvitationOtherSession } from 'components/features/invitation/InvitationOtherSession'
import { InvitationUserConfirm } from 'components/features/invitation/invitationUserConfirm'
import { getInvitationStatus } from 'lib/api/lasius/invitations-public/invitations-public'
import { getServerSidePropsWithoutAuth } from 'lib/auth/getServerSidePropsWithoutAuth'
import { logger } from 'lib/logger'
import { GetServerSideProps, NextPage } from 'next'
import { getServerSession, Session } from 'next-auth'
import { useRouter } from 'next/router'
import { nextAuthOptions } from 'pages/api/auth/[...nextauth]'
import { useAsync } from 'react-async-hook'

const Join: NextPage<{ session: Session; locale?: string }> = ({ session, locale }) => {
  const router = useRouter()
  const { invitationId = '' } = router.query as { invitationId: string }

  const invitationStatus = useAsync((id: string) => getInvitationStatus(id), [invitationId])

  if (invitationStatus.loading) return null

  if (invitationStatus.status === 'error') {
    return <InvitationInvalid />
  }

  const invitation = invitationStatus.result

  if (invitation?.invitation?.id && invitation?.invitation?.invitedEmail && session === null) {
    logger.info('[Join][NotAuthenticated]', session)
    // login user and handle invitation logic again
    const url =
      '/login?' +
      new URLSearchParams({
        invitation_id: invitation.invitation?.id,
        email: invitation.invitation?.invitedEmail,
        locale: locale || '',
      })
    router.replace(url)
  }

  if (invitation && session !== null) {
    // check if invitation matches current users session
    if (session.user && session.user.email !== invitation.invitation.invitedEmail) {
      return <InvitationOtherSession invitation={invitation} />
    }

    // handle invite for logged in user, confirm
    return <InvitationUserConfirm invitation={invitation} />
  }

  return null
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getServerSidePropsWithoutAuth(context, async (context, locale) => {
    const session = await getServerSession(context.req, context.res, nextAuthOptions(locale))
    return {
      session,
    }
  })
}

export default Join
