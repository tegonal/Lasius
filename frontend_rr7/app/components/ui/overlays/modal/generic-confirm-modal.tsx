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
import { Alert } from '~/components/ui/feedback/alert'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FormElement } from '~/components/ui/forms/form-element'

import { Modal } from './modal'
import { ModalCloseButton } from './modal-close-button'
import { ModalTitle } from './modal-title'

type Props = {
  alert?: {
    message: string
    variant: 'error' | 'info' | 'success' | 'warning'
  }
  blockViewport?: boolean
  cancelLabel?: string
  confirmLabel: string
  confirmVariant?: 'error' | 'primary' | 'secondary'
  message: string
  onClose: () => void
  onConfirm: () => void
  open: boolean
  title?: string
}

/**
 * Generic confirmation modal component
 * Supports simple confirmations and confirmations with title/alert/warning boxes
 * Consolidates: TagGroupDeleteConfirmModal, TagGroupUnsavedChangesModal, ModalConfirmDeleteUser
 */
export const GenericConfirmModal = ({
  alert,
  blockViewport,
  cancelLabel,
  confirmLabel,
  confirmVariant = 'primary',
  message,
  onClose,
  onConfirm,
  open,
  title,
}: Props) => {
  const { t } = useTranslation('common')
  const resolvedCancelLabel =
    cancelLabel ?? t('common.actions.close', { defaultValue: 'Close' })

  return (
    <Modal blockViewport={blockViewport} onClose={onClose} open={open}>
      <div className="flex flex-col gap-4">
        <ModalCloseButton onClose={onClose} />

        {title && <ModalTitle>{title}</ModalTitle>}

        {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

        <FormElement>
          <p>{message}</p>
        </FormElement>

        <ButtonGroup>
          <Button onClick={onConfirm} type="button" variant={confirmVariant}>
            {confirmLabel}
          </Button>
          <Button onClick={onClose} type="button" variant="secondary">
            {resolvedCancelLabel}
          </Button>
        </ButtonGroup>
      </div>
    </Modal>
  )
}
