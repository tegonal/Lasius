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

import { Button } from '~/components/primitives/buttons/button'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FormBody } from '~/components/ui/forms/form-body'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalDescription } from '~/components/ui/overlays/modal/modal-description'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'

type InviteAssignedResultProperties = {
  email: string
  onClose: () => void
}

// A project invite returns no invitation link when the backend assigns an existing user directly.
export const InviteAssignedResult = ({ email, onClose }: InviteAssignedResultProperties) => {
  const { t } = useTranslation()

  return (
    <FormBody>
      <ModalCloseButton onClose={onClose} />

      <ModalHeader>{t('invitation:title.userAssigned', 'User assigned')}</ModalHeader>

      <ModalDescription>
        {t('projects:status.assignedToUser', 'Project successfully assigned to user.')}
      </ModalDescription>

      <div className="flex gap-3">
        <code className="bg-base-200 rounded px-2 py-1">{email}</code>
      </div>

      <ButtonGroup>
        <Button
          data-testid="org-invite-assigned-close-btn"
          onClick={onClose}
          type="button"
          variant="primary">
          {t('actions.close', 'Close')}
        </Button>
      </ButtonGroup>
    </FormBody>
  )
}
