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

import React, { useRef } from 'react'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Label } from '~/components/primitives/typography/label'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FormElement } from '~/components/ui/forms/form-element'

import { Modal } from './modal'
import { ModalCloseButton } from './modal-close-button'

type GenericInputModalProperties = {
  cancelLabel?: string
  confirmLabel: string
  enableEnterKey?: boolean
  label: string
  onChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
  open: boolean
  placeholder: string
  value: string
}

/** Modal with one controlled text input and a confirm and a cancel button. */
export const GenericInputModal = ({
  cancelLabel = 'Close',
  confirmLabel,
  enableEnterKey = false,
  label,
  onChange,
  onClose,
  onConfirm,
  open,
  placeholder,
  value,
}: GenericInputModalProperties) => {
  const inputReference = useRef<HTMLInputElement>(null)

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!(enableEnterKey && event.key === 'Enter')) {
      return
    }

    event.preventDefault()
    onConfirm()
  }

  return (
    <Modal initialFocus={inputReference} onClose={onClose} open={open}>
      <ModalCloseButton onClose={onClose} />
      <FormElement>
        <Label>{label}</Label>
        <Input
          autoComplete="off"
          data-testid="input-modal-input"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={enableEnterKey ? handleKeyDown : undefined}
          placeholder={placeholder}
          ref={inputReference}
          value={value}
        />
      </FormElement>
      <ButtonGroup>
        <Button
          data-testid="input-modal-confirm-btn"
          onClick={onConfirm}
          type="button"
          variant="primary">
          {confirmLabel}
        </Button>
        <Button onClick={onClose} type="button" variant="secondary">
          {cancelLabel}
        </Button>
      </ButtonGroup>
    </Modal>
  )
}
