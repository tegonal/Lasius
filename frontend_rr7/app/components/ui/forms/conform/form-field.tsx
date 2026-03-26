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

import {
  Input,
  type InputProps,
  Textarea,
  type TextareaProps,
} from '~/components/primitives/inputs/input'
import { FormElement } from '~/components/ui/forms/form-element'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'

interface FormFieldProps extends Omit<InputProps, 'name' | 'type'> {
  field: FieldMetadata<string>
  label?: string
  labelActionSlot?: React.ReactNode
  required?: boolean
  type?: InputType
}

type InputType =
  | 'email'
  | 'hidden'
  | 'number'
  | 'password'
  | 'tel'
  | 'text'
  | 'url'

/**
 * Conform-native form field wrapper.
 * Combines FormElement (label) + Input primitive + FormFieldErrors into one component.
 *
 * Usage:
 * ```tsx
 * <FormField field={fields.email} label={t('forms.email')} type="email" />
 * ```
 */
export const FormField = ({
  field,
  label,
  labelActionSlot,
  required,
  type = 'text',
  ...inputProps
}: FormFieldProps) => {
  const hasErrors = !!field.errors?.length

  if (type === 'hidden') {
    return (
      <input {...getInputProps(field, { type: 'hidden' })} key={field.key} />
    )
  }

  return (
    <FormElement
      htmlFor={field.id}
      label={label}
      labelActionSlot={labelActionSlot}
      required={required}
    >
      <Input
        error={hasErrors}
        {...getInputProps(field, { type })}
        key={field.key}
        {...inputProps}
      />
      <FormFieldErrors errors={field.errors} id={`${field.id}-errors`} />
    </FormElement>
  )
}

interface FormTextareaFieldProps extends Omit<TextareaProps, 'name'> {
  field: FieldMetadata<string>
  label?: string
  labelActionSlot?: React.ReactNode
  required?: boolean
}

/**
 * Conform-native textarea field wrapper.
 */
export const FormTextareaField = ({
  field,
  label,
  labelActionSlot,
  required,
  ...textareaProps
}: FormTextareaFieldProps) => {
  const hasErrors = !!field.errors?.length

  return (
    <FormElement
      htmlFor={field.id}
      label={label}
      labelActionSlot={labelActionSlot}
      required={required}
    >
      <Textarea
        error={hasErrors}
        id={field.id}
        key={field.key}
        name={field.name}
        {...textareaProps}
      />
      <FormFieldErrors errors={field.errors} id={`${field.id}-errors`} />
    </FormElement>
  )
}
