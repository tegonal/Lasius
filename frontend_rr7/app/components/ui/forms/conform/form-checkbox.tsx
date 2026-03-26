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

import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { cn } from '~/lib/utils/cn'

interface FormCheckboxProps {
  children: React.ReactNode
  className?: string
  field: FieldMetadata<boolean>
}

/**
 * Conform-native checkbox field wrapper with DaisyUI styling.
 *
 * Usage:
 * ```tsx
 * <FormCheckbox field={fields.acceptTerms}>
 *   {t('forms.acceptTerms')}
 * </FormCheckbox>
 * ```
 */
export const FormCheckbox = ({
  children,
  className,
  field,
}: FormCheckboxProps) => {
  const hasErrors = !!field.errors?.length

  return (
    <div className={cn('space-y-2', className)}>
      <label className="label cursor-pointer justify-start gap-3">
        <input
          {...getInputProps(field, { type: 'checkbox' })}
          className={cn('checkbox', hasErrors && 'checkbox-error')}
          key={field.key}
        />
        <span>{children}</span>
      </label>
      <FormFieldErrors errors={field.errors} id={`${field.id}-errors`} />
    </div>
  )
}
