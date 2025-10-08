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
import { FormElement } from 'components/ui/forms/FormElement'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { useModalState } from 'components/ui/overlays/modal/useModalState'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  text?: {
    action: string
    confirm?: string
    cancel?: string
  }
  dangerLevel?: 'notification' | 'destructive'
  onCancel?: () => void
  onConfirm: () => void
  children?: React.ReactNode
  hideButtons?: boolean
  autoSize?: boolean
}

export const ModalConfirm: React.FC<Props> = ({
  text,
  onConfirm,
  onCancel,
  dangerLevel = 'notification',
  children,
  hideButtons = false,
  autoSize = false,
}) => {
  const { t } = useTranslation('common')
  const { isOpen, handleClose, handleConfirm } = useModalState({ onCancel, onConfirm })

  return (
    <Modal open={isOpen} onClose={handleClose} blockViewport autoSize={autoSize}>
      {text && <div className="mb-4">{text.action}</div>}
      {children && <div className="mb-4">{children}</div>}
      {!hideButtons && (
        <FormElement>
          <Button
            variant={dangerLevel === 'notification' ? 'primary' : 'secondary'}
            onClick={handleConfirm}>
            {text?.confirm || t('common.ok', { defaultValue: 'Ok' })}
          </Button>
          {onCancel && (
            <Button variant="secondary" onClick={handleClose}>
              {text?.cancel || t('common.actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
          )}
        </FormElement>
      )}
    </Modal>
  )
}
