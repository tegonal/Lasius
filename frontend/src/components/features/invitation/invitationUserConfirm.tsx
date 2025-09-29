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

import { LoginLayout } from 'components/features/login/loginLayout'
import { SelectUserOrganisationModal } from 'components/features/user/selectUserOrganisationModal'
import { Button } from 'components/primitives/buttons/Button'
import { Card, CardBody } from 'components/ui/cards/Card'
import { Alert } from 'components/ui/feedback/Alert'
import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { Logo } from 'components/ui/icons/Logo'
import { TegonalFooter } from 'components/ui/navigation/TegonalFooter'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import {
  ModelsEntityReference,
  ModelsInvitationStatusResponse,
  ModelsJoinOrganisationInvitation,
  ModelsJoinProjectInvitation,
} from 'lib/api/lasius'
import {
  acceptInvitation,
  declineInvitation,
} from 'lib/api/lasius/invitations-private/invitations-private'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

type Props = {
  invitation: ModelsInvitationStatusResponse
}

export const InvitationUserConfirm: React.FC<Props> = ({ invitation }) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [orgAssignment, setOrgAssignment] = useState<ModelsEntityReference>()
  const { selectedOrganisation, organisations } = useOrganisation()
  const plausible = usePlausible<LasiusPlausibleEvents>()

  useEffect(() => {
    if (
      invitation.invitation.type === 'JoinProjectInvitation' &&
      organisations.find(
        (o) =>
          o.organisationReference.id ===
          (invitation.invitation as ModelsJoinProjectInvitation).sharedByOrganisationReference.id,
      )
    ) {
      setOrgAssignment(
        (invitation.invitation as ModelsJoinProjectInvitation).sharedByOrganisationReference,
      )
    } else {
      setOrgAssignment(selectedOrganisation?.organisationReference)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organisations])

  const handleAcceptInvite = async () => {
    plausible('invitation', {
      props: {
        status: 'accept',
      },
    })
    await acceptInvitation(invitation.invitation.id, {
      organisationReference: orgAssignment,
    })
    await router.push('/')
    await router.reload()
  }

  const handleRejectInvite = async () => {
    plausible('invitation', {
      props: {
        status: 'reject',
      },
    })
    await declineInvitation(invitation.invitation.id)
    await router.push('/')
    await router.reload()
  }

  return (
    <LoginLayout>
      {invitation.invitation.type === 'JoinOrganisationInvitation' && (
        <Alert variant="info" className="max-w-md">
          {t('invitations.messages.invitedToOrganisation', {
            defaultValue:
              'You have been invited by {{inviter}} to join organisation {{organisation}}.',
            inviter: invitation.invitation.createdBy.key,
            organisation: (invitation.invitation as ModelsJoinOrganisationInvitation)
              .organisationReference.key,
          })}
        </Alert>
      )}
      {invitation.invitation.type === 'JoinProjectInvitation' && (
        <Alert variant="info" className="max-w-md">
          {t('invitations.messages.invitedToProject', {
            defaultValue: 'You have been invited by {{inviter}} to join project {{project}}.',
            inviter: invitation.invitation.createdBy.key,
            project: (invitation.invitation as ModelsJoinProjectInvitation).projectReference.key,
          })}
        </Alert>
      )}
      <Card shadow="xl" className="border-base-300 bg-base-100 w-full max-w-md border">
        <CardBody className="gap-6 p-8">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="h-4" />
          <FormBody>
            {organisations && invitation.invitation.type === 'JoinProjectInvitation' && (
              <>
                <FormElement>
                  <p>
                    {t('invitations.messages.selectOrganisation', {
                      defaultValue:
                        'Select the organisation you would like to add this project to:',
                    })}
                  </p>
                </FormElement>
                <FormElement>
                  <SelectUserOrganisationModal
                    onSelect={setOrgAssignment}
                    selected={orgAssignment}
                  />
                </FormElement>
              </>
            )}
            <FormElement>
              <Button onClick={handleAcceptInvite} fullWidth>
                {t('invitations.actions.accept', { defaultValue: 'Accept invitation' })}
              </Button>
              <Button variant="ghost" onClick={handleRejectInvite} fullWidth>
                {t('invitations.actions.reject', { defaultValue: 'Reject invitation' })}
              </Button>
            </FormElement>
          </FormBody>
        </CardBody>
      </Card>
      <TegonalFooter />
    </LoginLayout>
  )
}
