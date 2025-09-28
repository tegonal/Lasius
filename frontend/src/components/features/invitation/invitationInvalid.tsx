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
import { Card, CardBody } from 'components/ui/cards/Card'
import { Alert } from 'components/ui/feedback/Alert'
import { Logo } from 'components/ui/icons/Logo'
import { TegonalFooter } from 'components/ui/navigation/TegonalFooter'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const InvitationInvalid: React.FC = () => {
  const { t } = useTranslation('common')
  const plausible = usePlausible<LasiusPlausibleEvents>()

  plausible('invitation', {
    props: {
      status: 'invalid',
    },
  })

  return (
    <LoginLayout>
      <Card shadow="xl" className="border-base-300 bg-base-100 w-full max-w-md border">
        <CardBody className="gap-6 p-8">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="h-4" />
          <Alert variant="warning">
            {t('invitations.errors.noLongerValid', {
              defaultValue:
                'This invitation is no longer valid. It is best to contact the person who sent you the invitation link to get a new one.',
            })}
          </Alert>
        </CardBody>
      </Card>
      <TegonalFooter />
    </LoginLayout>
  )
}
