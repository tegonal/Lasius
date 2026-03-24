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

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { Card, CardBody } from '~/components/ui/cards/card'
import { Alert } from '~/components/ui/feedback/alert'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { Logo } from '~/components/ui/icons/logo'
import { AuthLayout } from '~/features/auth/auth-layout'
import { OrgSwitcherModal } from '~/features/organisation/components/org-switcher-modal'
import {
  useAcceptInvitation,
  useDeclineInvitation,
} from '~/services/api/lasius-hooks/invitations-private/invitations-private'
import { type ModelsEntityReference } from '~/services/api/lasius/modelsEntityReference'
import { type ModelsInvitationStatusResponse } from '~/services/api/lasius/modelsInvitationStatusResponse'
import { type ModelsUserOrganisation } from '~/services/api/lasius/modelsUserOrganisation'

interface Props {
  invitation: ModelsInvitationStatusResponse
  organisations: ModelsUserOrganisation[]
}

export const InvitationUserConfirm = ({ invitation, organisations }: Props) => {
  const { t } = useTranslation('invitation')
  const navigate = useNavigate()
  const [orgAssignment, setOrgAssignment] = useState<ModelsEntityReference>()
  const acceptInvitation = useAcceptInvitation()
  const declineInvitation = useDeclineInvitation()

  useEffect(() => {
    const inv = invitation.invitation
    if (
      inv.type === 'JoinProjectInvitation' &&
      'sharedByOrganisationReference' in inv &&
      organisations.find(
        (o) =>
          o.organisationReference.id === inv.sharedByOrganisationReference.id,
      )
    ) {
      setOrgAssignment(inv.sharedByOrganisationReference)
    } else {
      // Fall back to private org or first org
      const fallbackOrg =
        organisations.find((o) => o.private) ?? organisations[0]
      setOrgAssignment(fallbackOrg?.organisationReference)
    }
  }, [organisations, invitation.invitation])

  const handleAcceptInvite = () => {
    acceptInvitation.submit({
      body: { organisationReference: orgAssignment },
      invitationId: invitation.invitation.id,
    })
    void navigate('/')
  }

  const handleRejectInvite = () => {
    declineInvitation.submit({
      invitationId: invitation.invitation.id,
    })
    void navigate('/')
  }

  return (
    <AuthLayout>
      {invitation.invitation.type === 'JoinOrganisationInvitation' && (
        <Alert className="max-w-md" variant="info">
          {t('messages.invitedToOrganisation', {
            defaultValue:
              'You have been invited by {{inviter}} to join organisation {{organisation}}.',
            inviter: invitation.invitation.createdBy.key,
            organisation: invitation.invitation.organisationReference.key,
          })}
        </Alert>
      )}
      {invitation.invitation.type === 'JoinProjectInvitation' && (
        <Alert className="max-w-md" variant="info">
          {t('messages.invitedToProject', {
            defaultValue:
              'You have been invited by {{inviter}} to join project {{project}}.',
            inviter: invitation.invitation.createdBy.key,
            project: invitation.invitation.projectReference.key,
          })}
        </Alert>
      )}
      <Card
        className="border-base-300 bg-base-100 w-full max-w-md border"
        shadow="xl"
      >
        <CardBody className="gap-6 p-8">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="h-4" />
          <FormBody>
            {organisations &&
              invitation.invitation.type === 'JoinProjectInvitation' && (
                <>
                  <FormElement>
                    <p>
                      {t(
                        'messages.selectOrganisation',
                        'Select the organisation you would like to add this project to:',
                      )}
                    </p>
                  </FormElement>
                  <FormElement>
                    <OrgSwitcherModal
                      onSelect={setOrgAssignment}
                      selected={orgAssignment}
                    />
                  </FormElement>
                </>
              )}
            <FormElement>
              <Button
                data-testid="invite-accept-btn"
                fullWidth
                onClick={handleAcceptInvite}
              >
                {t('actions.accept', {
                  defaultValue: 'Accept invitation',
                })}
              </Button>
              <Button
                data-testid="invite-reject-btn"
                fullWidth
                onClick={handleRejectInvite}
                variant="ghost"
              >
                {t('actions.reject', {
                  defaultValue: 'Reject invitation',
                })}
              </Button>
            </FormElement>
          </FormBody>
        </CardBody>
      </Card>
    </AuthLayout>
  )
}
