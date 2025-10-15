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
import { InvitationNeedsAccount } from 'components/features/invitation/InvitationNeedsAccount'
import { InvitationOtherSession } from 'components/features/invitation/InvitationOtherSession'
import { InvitationUserConfirm } from 'components/features/invitation/invitationUserConfirm'
import { getInvitationStatus } from 'lib/api/lasius/invitations-public/invitations-public'
import { getServerSidePropsWithoutAuth } from 'lib/auth/getServerSidePropsWithoutAuth'
import { logger } from 'lib/logger'
import { GetServerSideProps, NextPage } from 'next'
import { getServerSession, Session } from 'next-auth'
import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { nextAuthOptions } from 'pages/api/auth/[...nextauth]'
import { useAsync } from 'react-async-hook'

const Join: NextPage<{ session: Session; locale?: string }> = ({ session, locale }) => {
  const router = useRouter()
  const { invitationId = '' } = router.query as { invitationId: string }

  const invitationStatus = useAsync((id: string) => getInvitationStatus(id), [invitationId])

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lasius.io'
  const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent('You have been invited!')}&subtitle=${encodeURIComponent('Join your team or project on Lasius')}`

  if (invitationStatus.loading) return null

  if (invitationStatus.status === 'error') {
    return <InvitationInvalid />
  }

  const invitation = invitationStatus.result

  if (invitation?.invitation?.id && invitation?.invitation?.invitedEmail && !session) {
    logger.info('[Join][NotAuthenticated]', { session, status: invitation.status })
    // Show appropriate component based on whether user exists
    return <InvitationNeedsAccount invitation={invitation} locale={locale} />
  }

  if (invitation && session) {
    // check if invitation matches current users session
    if (session?.user?.email && session.user.email !== invitation.invitation.invitedEmail) {
      return (
        <>
          <NextSeo
            title="Invitation - Lasius"
            description="You've been invited to join a team or project on Lasius - open source time tracking for teams."
            canonical={`${baseUrl}/join/${invitationId}`}
            openGraph={{
              url: `${baseUrl}/join/${invitationId}`,
              title: 'You have been invited!',
              description:
                'Join your team or project on Lasius - open source time tracking for teams.',
              images: [
                {
                  url: ogImageUrl,
                  width: 1200,
                  height: 630,
                  alt: 'You have been invited to join Lasius',
                },
              ],
              siteName: 'Lasius',
              type: 'website',
              locale: locale || 'en',
            }}
            twitter={{
              handle: '@tegonal',
              site: '@tegonal',
              cardType: 'summary_large_image',
            }}
          />
          <InvitationOtherSession invitation={invitation} />
        </>
      )
    }

    // handle invite for logged in user, confirm
    return (
      <>
        <NextSeo
          title="Invitation - Lasius"
          description="You've been invited to join a team or project on Lasius - open source time tracking for teams."
          canonical={`${baseUrl}/join/${invitationId}`}
          openGraph={{
            url: `${baseUrl}/join/${invitationId}`,
            title: 'You have been invited!',
            description:
              'Join your team or project on Lasius - open source time tracking for teams.',
            images: [
              {
                url: ogImageUrl,
                width: 1200,
                height: 630,
                alt: 'You have been invited to join Lasius',
              },
            ],
            siteName: 'Lasius',
            type: 'website',
            locale: locale || 'en',
          }}
          twitter={{
            handle: '@tegonal',
            site: '@tegonal',
            cardType: 'summary_large_image',
          }}
        />
        <InvitationUserConfirm invitation={invitation} />
      </>
    )
  }

  return null
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getServerSidePropsWithoutAuth(context, async (context) => {
    const session = await getServerSession(context.req, context.res, nextAuthOptions())
    return {
      session,
    }
  })
}

export default Join
