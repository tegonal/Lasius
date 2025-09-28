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
import { useSignOut } from 'components/features/system/hooks/useSignOut'
import { Button } from 'components/primitives/buttons/Button'
import { Card, CardBody } from 'components/ui/cards/Card'
import { Alert } from 'components/ui/feedback/Alert'
import { FormBody } from 'components/ui/forms/formBody'
import { FormElement } from 'components/ui/forms/formElement'
import { Logo } from 'components/ui/icons/Logo'
import { TegonalFooter } from 'components/ui/navigation/TegonalFooter'
import { ModelsInvitationStatusResponse } from 'lib/api/lasius'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React from 'react'

type Props = {
  invitation: ModelsInvitationStatusResponse
}

export const InvitationOtherSession: React.FC<Props> = ({ invitation }) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { signOut } = useSignOut()

  const plausible = usePlausible<LasiusPlausibleEvents>()

  plausible('invitation', {
    props: {
      status: 'wrongUser',
    },
  })

  const handleSignOut = async () => {
    await signOut()
    router.reload()
  }

  return (
    <LoginLayout>
      <Card shadow="xl" className="border-base-300 bg-base-100 w-full max-w-md border">
        <CardBody className="gap-6 p-8">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="h-4" />
          <Alert variant="warning">
            {t('invitations.errors.createdForSomeoneElse', {
              defaultValue:
                'This invitation has been created for someone else. Either log out and refresh, or forward the invitation link to the user {{email}}',
              email: invitation.invitation.invitedEmail,
            })}
          </Alert>
          <FormBody>
            <FormElement>
              <Button onClick={handleSignOut} fullWidth>
                {t('auth.actions.signOutAndRefresh', { defaultValue: 'Sign out and refresh' })}
              </Button>
            </FormElement>
          </FormBody>
        </CardBody>
      </Card>
      <TegonalFooter />
    </LoginLayout>
  )
}
