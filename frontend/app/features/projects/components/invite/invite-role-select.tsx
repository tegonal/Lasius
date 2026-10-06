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

import { type FieldMetadata, useInputControl } from '@conform-to/react'
import { useTranslation } from 'react-i18next'

import { Label } from '~/components/primitives/typography/label'
import { FormElement } from '~/components/ui/forms/form-element'
import { Select } from '~/components/ui/forms/input/select'
import { getDefaultRole, getRoleOptions, type RoleScope } from '~/features/projects/lib/role-labels'
import { untyped } from '~/lib/i18n-types'

type InviteRoleSelectProperties = {
  field: FieldMetadata<string | undefined>
  label: string
  scope: RoleScope
}

export const InviteRoleSelect = ({ field, label, scope }: InviteRoleSelectProperties) => {
  const { t } = useTranslation()
  const control = useInputControl(field)
  const value = control.value || getDefaultRole(scope)

  return (
    <FormElement>
      <Label htmlFor={field.id}>{label}</Label>
      <input name={field.name} type="hidden" value={value} />
      <Select
        id={field.id}
        onChange={(selected) => control.change(selected)}
        options={getRoleOptions(scope, untyped(t))}
        value={value}
      />
    </FormElement>
  )
}
