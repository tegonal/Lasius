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
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FormElement } from 'components/ui/forms/FormElement'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { ModalCloseButton } from 'components/ui/overlays/modal/ModalCloseButton'
import { ModalTitle } from 'components/ui/overlays/modal/ModalTitle'
import React from 'react'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  message: string
  confirmLabel: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'secondary' | 'error'
  title?: string
  alert?: {
    variant: 'info' | 'success' | 'warning' | 'error'
    message: string
  }
  blockViewport?: boolean
}

/**
 * Generic confirmation modal component
 * Supports simple confirmations and confirmations with title/alert/warning boxes
 * Consolidates: TagGroupDeleteConfirmModal, TagGroupUnsavedChangesModal, ModalConfirmDeleteUser
 */
export const GenericConfirmModal: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  message,
  confirmLabel,
  cancelLabel = 'Close',
  confirmVariant = 'primary',
  title,
  alert,
  blockViewport,
}) => {
  return (
    <Modal open={open} onClose={onClose} blockViewport={blockViewport}>
      <div className="flex flex-col gap-4">
        <ModalCloseButton onClose={onClose} />

        {title && <ModalTitle>{title}</ModalTitle>}

        {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

        <FormElement>
          <P>{message}</P>
        </FormElement>

        <ButtonGroup>
          <Button type="button" variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
        </ButtonGroup>
      </div>
    </Modal>
  )
}
