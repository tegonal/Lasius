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

import { Button } from 'components/primitives/buttons/Button'
import { P } from 'components/primitives/typography/Paragraph'
import { Alert } from 'components/ui/feedback/Alert'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { Clock } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  open: boolean
  onLoginAgain: () => void
}

/**
 * Modal that displays when the user's session has expired
 * Informs the user they need to log in again
 */
export const SessionTimeoutModal: React.FC<Props> = ({ open, onLoginAgain }) => {
  const { t } = useTranslation('common')

  return (
    <Modal open={open} onClose={() => {}} blockViewport autoSize>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="text-warning">
            <LucideIcon icon={Clock} size={32} />
          </div>
          <div className="text-lg font-semibold">
            {t('auth.sessionExpired.title', { defaultValue: 'Session Expired' })}
          </div>
        </div>

        <Alert variant="warning">
          {t('auth.sessionExpired.alert', {
            defaultValue: 'Your session has timed out for security reasons.',
          })}
        </Alert>

        <P>
          {t('auth.sessionExpired.message', {
            defaultValue: 'Please log in again to continue using the application.',
          })}
        </P>

        <div className="flex justify-end">
          <Button type="button" variant="primary" onClick={onLoginAgain}>
            {t('auth.sessionExpired.loginButton', { defaultValue: 'Log In Again' })}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
