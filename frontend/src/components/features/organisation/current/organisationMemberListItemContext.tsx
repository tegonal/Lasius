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
import { Alert } from 'components/ui/feedback/Alert'
import { FormElement } from 'components/ui/forms/FormElement'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { AnimatePresence } from 'framer-motion'
import { useProfile } from 'lib/api/hooks/useProfile'
import { ModelsUserStub } from 'lib/api/lasius'
import { UserMinus } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'

type Props = {
  user: ModelsUserStub
  onRemove: () => void
  canRemove: boolean
}

export const OrganisationMemberListItemContext: React.FC<Props> = ({
  user,
  onRemove,
  canRemove,
}) => {
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const { handleCloseAll, currentOpenContextMenuId } = useContextMenu()
  const { t } = useTranslation('common')
  const { userId } = useProfile()

  const isCurrentUser = user.id === userId

  const handleRemove = () => {
    setShowConfirmationDialog(true)
    handleCloseAll()
  }

  const [isOpen, setIsOpen] = useState(false)

  const handleConfirm = () => {
    setIsOpen(false)
    setShowConfirmationDialog(false)
    onRemove()
  }

  const handleCancel = () => {
    setIsOpen(false)
    setShowConfirmationDialog(false)
  }

  useEffect(() => {
    if (showConfirmationDialog) {
      setIsOpen(true)
    }
  }, [showConfirmationDialog])

  if (!canRemove || isCurrentUser) {
    return null
  }

  const memberName = `${user.firstName} ${user.lastName}`

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
                    onClick={handleRemove}
                    fullWidth={false}
                    shape="circle">
                    <LucideIcon icon={UserMinus} size={24} />
                  </Button>
                </ContextButtonWrapper>
                <ContextBarDivider />
                <ContextButtonClose variant="compact" />
              </ContextBar>
            </ContextAnimatePresence>
          )}
        </AnimatePresence>
      </ContextBody>
      {showConfirmationDialog && (
        <Modal open={isOpen} onClose={handleCancel} blockViewport autoSize>
          <div className="flex max-w-md flex-col gap-4">
            <div className="text-lg font-semibold">
              {t('members.confirmations.removeTitle', {
                defaultValue: 'Remove member',
              })}
            </div>

            <Alert variant="warning">
              {t('members.confirmations.removeWarning', {
                defaultValue:
                  'This member will be removed from the organisation and lose access to all projects.',
              })}
            </Alert>

            <div>
              {t('members.confirmations.removeConfirm', {
                defaultValue: 'Are you sure you want to remove {{name}}?',
                name: memberName,
              })}
            </div>

            <FormElement>
              <Button variant="primary" onClick={handleConfirm}>
                {t('members.actions.remove', { defaultValue: 'Remove member' })}
              </Button>
              <Button variant="secondary" onClick={handleCancel}>
                {t('common.actions.close', { defaultValue: 'Close' })}
              </Button>
            </FormElement>
          </div>
        </Modal>
      )}
    </>
  )
}
