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

import { UserX } from 'lucide-react'
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

type Props = {
  canRemove: boolean
  onRemove: () => void
  user: ModelsUserStub
}

export const ProjectMemberListItemContext = ({
  canRemove,
  onRemove,
  user,
}: Props) => {
  const { t } = useTranslation()
  const { currentOpenContextMenuId, handleCloseAll } = useContextMenu()
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
    setIsRemoveConfirmOpen(false)
  }

  if (!canRemove) {
    return null
  }

  return (
    <>
      <ContextBody variant="compact">
        <ContextButtonOpen hash={user.id} />
        {currentOpenContextMenuId === user.id && (
          <ContextAnimatePresence variant="compact">
            <ContextBar>
              <ContextButtonWrapper variant="compact">
                <Button
                  aria-label={t(
                    'organisation:members.actions.remove',
                    'Remove member',
                  )}
                  fullWidth={false}
                  onClick={showRemoveConfirm}
                  shape="circle"
                  title={t(
                    'organisation:members.actions.remove',
                    'Remove member',
                  )}
                  variant="contextIcon"
                >
                  <LucideIcon icon={UserX} size={24} />
                </Button>
              </ContextButtonWrapper>
              <ContextBarDivider />
              <ContextButtonClose variant="compact" />
            </ContextBar>
          </ContextAnimatePresence>
        )}
      </ContextBody>
      <GenericConfirmModal
        confirmLabel={t('organisation:members.actions.remove', 'Remove member')}
        confirmVariant="error"
        message={t(
          'organisation:members.confirmRemove',
          'Are you sure you want to remove this member from the project?',
        )}
        onClose={handleRemoveConfirmClose}
        onConfirm={handleRemove}
        open={isRemoveConfirmOpen}
        title={t('organisation:members.actions.remove', 'Remove member')}
      />
    </>
  )
}
