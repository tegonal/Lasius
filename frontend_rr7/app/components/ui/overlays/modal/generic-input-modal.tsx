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

import { type FieldMetadata, getInputProps } from '@conform-to/react'
import React from 'react'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Label } from '~/components/primitives/typography/label'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FormElement } from '~/components/ui/forms/form-element'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'

import { Modal } from './modal'

type ConformProps = SharedProps & {
  /** @deprecated Use field prop instead */
  error?: never
  field: FieldMetadata<string>
  /** @deprecated Use field prop instead */
  fieldName?: never
  onChange?: never
  /** @deprecated Use field prop instead */
  register?: never
  value?: never
}

type ControlledProps = SharedProps & {
  error?: never
  field?: never
  fieldName?: never
  onChange: (value: string) => void
  register?: never
  value: string
}

type GenericInputModalProps = ConformProps | ControlledProps

type SharedProps = {
  cancelLabel?: string
  confirmLabel: string
  enableEnterKey?: boolean
  label: string
  onClose: () => void
  onConfirm: () => void
  open: boolean
  placeholder: string
}

/**
 * Generic input modal component for text input with form validation.
 * Supports both Conform (field prop) and Controlled (value/onChange props) modes.
 */
export const GenericInputModal = (props: GenericInputModalProps) => {
  if (props.field) {
    return <ConformInputModal {...props} field={props.field} />
  }
  return (
    <ControlledInputModal
      {...props}
      onChange={props.onChange}
      value={props.value}
    />
  )
}

const ConformInputModal = ({
  cancelLabel = 'Close',
  confirmLabel,
  enableEnterKey = false,
  field,
  label,
  onClose,
  onConfirm,
  open,
  placeholder,
}: SharedProps & { field: FieldMetadata<string> }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (enableEnterKey && e.key === 'Enter') {
      e.preventDefault()
      onConfirm()
    }
  }

  return (
    <Modal onClose={onClose} open={open}>
      <FormElement>
        <Label htmlFor={field.id}>{label}</Label>
        <Input
          {...getInputProps(field, { type: 'text' })}
          autoComplete="off"
          autoFocus
          key={field.key}
          onKeyDown={enableEnterKey ? handleKeyDown : undefined}
          placeholder={placeholder}
        />
        <FormFieldErrors errors={field.errors} />
      </FormElement>
      <ButtonGroup>
        <Button onClick={onConfirm} type="button" variant="primary">
          {confirmLabel}
        </Button>
        <Button onClick={onClose} type="button" variant="secondary">
          {cancelLabel}
        </Button>
      </ButtonGroup>
    </Modal>
  )
}

/** Controlled mode — value/onChange props */
const ControlledInputModal = ({
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
}: SharedProps & { onChange: (value: string) => void; value: string }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (enableEnterKey && e.key === 'Enter') {
      e.preventDefault()
      onConfirm()
    }
  }

  return (
    <Modal onClose={onClose} open={open}>
      <FormElement>
        <Label>{label}</Label>
        <Input
          autoComplete="off"
          autoFocus
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={enableEnterKey ? handleKeyDown : undefined}
          placeholder={placeholder}
          value={value}
        />
      </FormElement>
      <ButtonGroup>
        <Button onClick={onConfirm} type="button" variant="primary">
          {confirmLabel}
        </Button>
        <Button onClick={onClose} type="button" variant="secondary">
          {cancelLabel}
        </Button>
      </ButtonGroup>
    </Modal>
  )
}
