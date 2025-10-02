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

import { ContextButtonClose } from 'components/features/contextMenu/buttons/contextButtonClose'
import { ContextButtonOpen } from 'components/features/contextMenu/buttons/contextButtonOpen'
import { ContextAnimatePresence } from 'components/features/contextMenu/contextAnimatePresence'
import { ContextBar } from 'components/features/contextMenu/contextBar'
import { ContextBarDivider } from 'components/features/contextMenu/contextBarDivider'
import { ContextBody } from 'components/features/contextMenu/contextBody'
import { ContextButtonWrapper } from 'components/features/contextMenu/contextButtonWrapper'
import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { Button } from 'components/primitives/buttons/Button'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { GenericConfirmModal } from 'components/ui/overlays/modal/GenericConfirmModal'
import { AnimatePresence } from 'framer-motion'
import { ModelsUserStub } from 'lib/api/lasius'
import { UserX } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'

type Props = {
  user: ModelsUserStub
  onRemove: () => void
  canRemove: boolean
}

export const ProjectMemberListItemContext: React.FC<Props> = ({ user, onRemove, canRemove }) => {
  const { t } = useTranslation('common')
  const { handleCloseAll, currentOpenContextMenuId } = useContextMenu()
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false)

  const showRemoveConfirm = () => {
    setIsRemoveConfirmOpen(true)
    handleCloseAll()
  }

  const handleRemoveConfirmClose = () => {
    setIsRemoveConfirmOpen(false)
  }

  const handleRemove = () => {
    onRemove()
    handleRemoveConfirmClose()
  }

  if (!canRemove) {
    return null
  }

  return (
    <>
      <ContextBody variant="compact">
        <ContextButtonOpen hash={user.id} />
        <AnimatePresence>
          {currentOpenContextMenuId === user.id && (
            <ContextAnimatePresence variant="compact">
              <ContextBar>
                <ContextButtonWrapper variant="compact">
                  <Button
                    variant="contextIcon"
                    title={t('members.actions.remove', { defaultValue: 'Remove member' })}
                    aria-label={t('members.actions.remove', { defaultValue: 'Remove member' })}
                    onClick={showRemoveConfirm}
                    fullWidth={false}
                    shape="circle">
                    <LucideIcon icon={UserX} size={24} />
                  </Button>
                </ContextButtonWrapper>
                <ContextBarDivider />
                <ContextButtonClose variant="compact" />
              </ContextBar>
            </ContextAnimatePresence>
          )}
        </AnimatePresence>
      </ContextBody>
      {isRemoveConfirmOpen && (
        <GenericConfirmModal
          open={isRemoveConfirmOpen}
          onClose={handleRemoveConfirmClose}
          onConfirm={handleRemove}
          title={t('members.confirmations.removeTitle', {
            defaultValue: 'Remove member',
          })}
          alert={{
            variant: 'warning',
            message: t('members.confirmations.removeWarning', {
              defaultValue:
                'This member will be removed from the organisation and lose access to all projects.',
            }),
          }}
          message={t('members.confirmations.removeConfirm', {
            defaultValue: 'Are you sure you want to remove {{name}}?',
            name: `${user.firstName} ${user.lastName}`,
          })}
          confirmLabel={t('members.actions.remove', { defaultValue: 'Remove member' })}
          cancelLabel={t('common.actions.cancel', { defaultValue: 'Cancel' })}
          confirmVariant="primary"
          blockViewport
          autoSize
        />
      )}
    </>
  )
}
