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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { GenericConfirmModal } from '~/components/ui/overlays/modal/generic-confirm-modal'
import { ContextButtonClose } from '~/features/context-menu/buttons/context-button-close'
import { ContextButtonOpen } from '~/features/context-menu/buttons/context-button-open'
import { ContextAnimatePresence } from '~/features/context-menu/context-animate-presence'
import { ContextBar } from '~/features/context-menu/context-bar'
import { ContextBarDivider } from '~/features/context-menu/context-bar-divider'
import { ContextBody } from '~/features/context-menu/context-body'
import { ContextButtonWrapper } from '~/features/context-menu/context-button-wrapper'
import { useContextMenu } from '~/features/context-menu/hooks/use-context-menu'
import { type ModelsUserStub } from '~/services/api/lasius'
import { useRemoveOrganisationUser } from '~/services/api/lasius-hooks/organisations/organisations'

type Props = {
  onRemoveComplete: () => void
  orgId: string
  user: ModelsUserStub
}

export const OrganisationMemberActions = ({
  onRemoveComplete,
  orgId,
  user,
}: Props) => {
  const { t } = useTranslation('organisation')
  const { handleCloseAll } = useContextMenu()
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false)

  const removeApi = useRemoveOrganisationUser({
    onSuccess: () => {
      setIsRemoveConfirmOpen(false)
      onRemoveComplete()
    },
  })

  const showRemoveConfirm = () => {
    setIsRemoveConfirmOpen(true)
    handleCloseAll()
  }

  const handleConfirm = () => {
    removeApi.submit({ orgId, userId: user.id })
  }

  const memberName = `${user.firstName} ${user.lastName}`

  return (
    <>
      <ContextBody hash={user.id} variant="compact">
        <ContextButtonOpen />
        <ContextAnimatePresence variant="compact">
          <ContextBar>
            <ContextButtonWrapper variant="compact">
              <Button
                aria-label={t('members.actions.remove', 'Remove member')}
                fullWidth={false}
                onClick={showRemoveConfirm}
                shape="circle"
                title={t('members.actions.remove', 'Remove member')}
                variant="contextIcon"
              >
                <LucideIcon icon={UserMinus} size={24} />
              </Button>
            </ContextButtonWrapper>
            <ContextBarDivider />
            <ContextButtonClose variant="compact" />
          </ContextBar>
        </ContextAnimatePresence>
      </ContextBody>
      <GenericConfirmModal
        alert={{
          message: t(
            'members.confirmations.removeWarning',
            'This member will be removed from the organisation and lose access to all projects.',
          ),
          variant: 'warning',
        }}
        confirmLabel={t('members.actions.remove', 'Remove member')}
        message={t(
          'members.confirmations.removeConfirm',
          'Are you sure you want to remove {{name}}?',
          { name: memberName },
        )}
        onClose={() => setIsRemoveConfirmOpen(false)}
        onConfirm={handleConfirm}
        open={isRemoveConfirmOpen}
        title={t('members.confirmations.removeTitle', 'Remove member')}
      />
    </>
  )
}
