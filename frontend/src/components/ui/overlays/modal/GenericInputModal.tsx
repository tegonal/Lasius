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
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FormElement } from 'components/ui/forms/FormElement'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { Modal } from 'components/ui/overlays/modal/Modal'
import React from 'react'
import { FieldError, UseFormRegister } from 'react-hook-form'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  register: UseFormRegister<any>
  fieldName: string
  label: string
  placeholder: string
  confirmLabel: string
  cancelLabel?: string
  error?: FieldError
  enableEnterKey?: boolean
}

/**
 * Generic input modal component for text input with form validation
 * Consolidates TagGroupAddModal and TagGroupAddTagModal patterns
 */
export const GenericInputModal: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  register,
  fieldName,
  label,
  placeholder,
  confirmLabel,
  cancelLabel = 'Cancel',
  error,
  enableEnterKey = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (enableEnterKey && e.key === 'Enter') {
      e.preventDefault()
      onConfirm()
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <FormElement>
        <Label htmlFor={fieldName}>{label}</Label>
        <Input
          {...register(fieldName)}
          autoComplete="off"
          placeholder={placeholder}
          autoFocus
          onKeyDown={enableEnterKey ? handleKeyDown : undefined}
        />
        {error && <FormErrorBadge error={error} />}
      </FormElement>
      <ButtonGroup>
        <Button type="button" variant="primary" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          {cancelLabel}
        </Button>
      </ButtonGroup>
    </Modal>
  )
}
