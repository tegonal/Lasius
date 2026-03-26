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

import { type FieldMetadata, getSelectProps } from '@conform-to/react'

import { FormElement } from '~/components/ui/forms/form-element'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { cn } from '~/lib/utils/cn'

interface FormSelectProps {
  className?: string
  disabled?: boolean
  field: FieldMetadata<string>
  label?: string
  labelActionSlot?: React.ReactNode
  options: SelectOption[]
  placeholder?: string
  required?: boolean
}

interface SelectOption {
  label: string
  value: string
}

/**
 * Conform-native select field wrapper with DaisyUI styling.
 *
 * Usage:
 * ```tsx
 * <FormSelect
 *   field={fields.language}
 *   label={t('forms.language')}
 *   options={[{ value: 'en', label: 'English' }]}
 *   placeholder={t('forms.selectLanguage')}
 * />
 * ```
 */
export const FormSelect = ({
  className,
  disabled,
  field,
  label,
  labelActionSlot,
  options,
  placeholder,
  required,
}: FormSelectProps) => {
  const hasErrors = !!field.errors?.length

  return (
    <FormElement
      htmlFor={field.id}
      label={label}
      labelActionSlot={labelActionSlot}
      required={required}
    >
      <select
        {...getSelectProps(field)}
        className={cn(
          'select select-bordered w-full',
          hasErrors && 'select-error',
          className,
        )}
        disabled={disabled}
        key={field.key}
      >
        {placeholder && (
          <option disabled value="">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <FormFieldErrors errors={field.errors} id={`${field.id}-errors`} />
    </FormElement>
  )
}
