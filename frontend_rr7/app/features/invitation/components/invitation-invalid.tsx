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

import { useTranslation } from 'react-i18next'

import { Card, CardBody } from '~/components/ui/cards/card'
import { Alert } from '~/components/ui/feedback/alert'
import { Logo } from '~/components/ui/icons/logo'
import { AuthLayout } from '~/features/auth/auth-layout'

export const InvitationInvalid = () => {
  const { t } = useTranslation('common')

  return (
    <AuthLayout>
      <Card
        className="border-base-300 bg-base-100 w-full max-w-md border"
        data-testid="invite-invalid"
        shadow="xl"
      >
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
    </AuthLayout>
  )
}
