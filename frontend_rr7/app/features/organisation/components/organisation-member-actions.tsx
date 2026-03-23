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

import { UserMinus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { GenericConfirmModal } from '~/components/ui/overlays/modal/generic-confirm-modal'
import { type ModelsUserStub } from '~/services/api/lasius'
import { useRemoveOrganisationUser } from '~/services/api/lasius-hooks/organisations/organisations'

type Props = {
  isRemoving: boolean
  onRemove: () => void
  onRemoveCancel: () => void
  onRemoveComplete: () => void
  orgId: string
  user: ModelsUserStub
}

export const OrganisationMemberActions = ({
  isRemoving,
  onRemove,
  onRemoveCancel,
  onRemoveComplete,
  orgId,
  user,
}: Props) => {
  const { t } = useTranslation('common')
  const removeApi = useRemoveOrganisationUser({
    onSuccess: () => onRemoveComplete(),
  })

  const handleConfirm = () => {
    removeApi.submit({ orgId, userId: user.id })
  }

  const memberName = `${user.firstName} ${user.lastName}`

  return (
    <>
      <Button
        aria-label={t('members.actions.remove', {
          defaultValue: 'Remove member',
        })}
        fullWidth={false}
        onClick={onRemove}
        shape="circle"
        variant="ghost"
      >
        <LucideIcon icon={UserMinus} size={16} />
      </Button>
      <GenericConfirmModal
        alert={{
          message: t('members.confirmations.removeWarning', {
            defaultValue:
              'This member will be removed from the organisation and lose access to all projects.',
          }),
          variant: 'warning',
        }}
        confirmLabel={t('members.actions.remove', {
          defaultValue: 'Remove member',
        })}
        message={t('members.confirmations.removeConfirm', {
          defaultValue: 'Are you sure you want to remove {{name}}?',
          name: memberName,
        })}
        onClose={onRemoveCancel}
        onConfirm={handleConfirm}
        open={isRemoving}
        title={t('members.confirmations.removeTitle', {
          defaultValue: 'Remove member',
        })}
      />
    </>
  )
}
