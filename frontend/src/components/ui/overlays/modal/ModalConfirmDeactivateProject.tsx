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
import { Input } from 'components/primitives/inputs/Input'
import { Label } from 'components/primitives/typography/Label'
import { Alert } from 'components/ui/feedback/Alert'
import { FormElement } from 'components/ui/forms/FormElement'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { useModalState } from 'components/ui/overlays/modal/useModalState'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'

type Props = {
  projectName: string
  onCancel: () => void
  onConfirm: () => void
}

export const ModalConfirmDeactivateProject: React.FC<Props> = ({
  projectName,
  onConfirm,
  onCancel,
}) => {
  const [inputValue, setInputValue] = useState('')
  const { t } = useTranslation('common')
  const { isOpen, handleClose } = useModalState({ onCancel })

  const handleConfirm = () => {
    if (inputValue === projectName) {
      onConfirm()
      handleClose()
    }
  }

  const isValid = inputValue === projectName

  return (
    <Modal open={isOpen} onClose={handleClose} blockViewport autoSize>
      <div className="flex max-w-md flex-col gap-4">
        <div className="text-lg font-semibold">
          {t('projects.confirmations.deactivateTitle', {
            defaultValue: 'Deactivate project',
          })}
        </div>

        <Alert variant="warning">
          {t('projects.confirmations.deactivateWarning', {
            defaultValue:
              'This action cannot be undone. The project will be permanently archived and all user assignments will be removed. You will not be able to reactivate this project.',
          })}
        </Alert>

        <div>
          {t('projects.confirmations.deactivateInstructions', {
            defaultValue: 'To confirm, please type the project name below:',
          })}
        </div>

        <FormElement>
          <Label htmlFor="projectName">
            {t('projects.name', { defaultValue: 'Project name' })}
          </Label>
          <Input
            id="projectName"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={projectName}
            autoFocus
          />
        </FormElement>

        <FormElement>
          <Button variant="primary" onClick={handleConfirm} disabled={!isValid}>
            {t('projects.actions.deactivate', { defaultValue: 'Deactivate project' })}
          </Button>
          <Button variant="secondary" onClick={handleClose}>
            {t('common.actions.close', { defaultValue: 'Close' })}
          </Button>
        </FormElement>
      </div>
    </Modal>
  )
}
