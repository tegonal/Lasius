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

import { LoginInfoPanel } from 'components/features/login/authInfoPanels'
import { AuthLayout } from 'components/features/login/authLayout'
import { Button } from 'components/primitives/buttons/Button'
import { Card, CardBody } from 'components/ui/cards/Card'
import { Alert } from 'components/ui/feedback/Alert'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import {
  ModelsInvitationStatusResponse,
  ModelsJoinOrganisationInvitation,
  ModelsJoinProjectInvitation,
} from 'lib/api/lasius'
import { LogIn } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React from 'react'

type Props = {
  invitation: ModelsInvitationStatusResponse
  locale?: string
}

export const InvitationNeedsAccount: React.FC<Props> = ({ invitation, locale }) => {
  const { t } = useTranslation('common')
  const router = useRouter()

  const handleContinue = () => {
    const url =
      '/login?' +
      new URLSearchParams({
        invitation_id: invitation.invitation.id,
        email: invitation.invitation.invitedEmail,
        locale: locale || '',
        needs_account: 'true',
      })
    router.push(url)
  }

  const invitationMessage =
    invitation.invitation.type === 'JoinOrganisationInvitation'
      ? t('invitations.messages.invitedToOrganisationNeedsAccount', {
          defaultValue:
            'You have been invited by {{inviter}} to join organisation {{organisation}}.',
          inviter: invitation.invitation.createdBy.key,
          organisation: (invitation.invitation as ModelsJoinOrganisationInvitation)
            .organisationReference.key,
        })
      : t('invitations.messages.invitedToProjectNeedsAccount', {
          defaultValue: 'You have been invited by {{inviter}} to join project {{project}}.',
          inviter: invitation.invitation.createdBy.key,
          project: (invitation.invitation as ModelsJoinProjectInvitation).projectReference.key,
        })

  return (
    <AuthLayout infoPanel={<LoginInfoPanel />}>
      {/* Info Alert */}
      <Alert variant="info">{invitationMessage}</Alert>

      {/* Main card */}
      <Card className="bg-base-100/80 border-0 shadow-2xl backdrop-blur-sm">
        <CardBody className="p-8 lg:p-10">
          <div className="mb-8 space-y-4 text-center">
            <h2 className="text-3xl font-bold">
              {t('invitations.needsAccount.title', {
                defaultValue: 'Account Required',
              })}
            </h2>
            <p className="text-base-content/60">
              {t('invitations.needsAccount.description', {
                defaultValue:
                  "You'll need to sign in or create an account for {{email}} to accept this invitation.",
                email: invitation.invitation.invitedEmail,
              })}
            </p>
          </div>

          <div className="space-y-4">
            <Alert variant="warning">
              {t('invitations.needsAccount.emailMatch', {
                defaultValue:
                  'Make sure to sign in with the email address this invitation was sent to: {{email}}',
                email: invitation.invitation.invitedEmail,
              })}
            </Alert>

            <Button onClick={handleContinue} fullWidth size="lg" className="gap-2">
              <LucideIcon icon={LogIn} size={18} />
              {t('invitations.needsAccount.continue', {
                defaultValue: 'Continue to Sign In',
              })}
            </Button>
          </div>
        </CardBody>
      </Card>
    </AuthLayout>
  )
}
