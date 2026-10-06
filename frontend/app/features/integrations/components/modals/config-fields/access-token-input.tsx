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

import { type FieldMetadata } from '@conform-to/react'

import { Input } from '~/components/primitives/inputs/input'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { type InputControl } from '~/features/integrations/components/modals/config-fields/jira-credential-fields'

// Password managers must not fill or save the credentials of an external platform.
export const noPasswordManager = {
  autoComplete: 'off',
  'data-1p-ignore': true,
  'data-form-type': 'other',
  'data-lpignore': 'true',
} as const

type AccessTokenInputProperties = {
  control: InputControl
  field: FieldMetadata<string | undefined>
  onValueChange?: () => void
  placeholder: string
}

// The control owns the field value, so the visible input is controlled and a hidden input submits it.
export const AccessTokenInput = ({
  control,
  field,
  onValueChange,
  placeholder,
}: AccessTokenInputProperties) => (
  <>
    <input name={field.name} type="hidden" value={control.value ?? ''} />
    <Input
      {...noPasswordManager}
      aria-invalid={field.errors ? true : undefined}
      id={field.id}
      key={field.key}
      onBlur={() => control.blur()}
      onChange={(event) => {
        control.change(event.target.value)
        onValueChange?.()
      }}
      onFocus={() => control.focus()}
      placeholder={placeholder}
      type="password"
      value={control.value ?? ''}
    />
    <FormFieldErrors errors={field.errors} />
  </>
)
