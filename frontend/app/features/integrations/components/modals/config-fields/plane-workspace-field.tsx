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
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/primitives/inputs/input'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'

type Properties = {
  field: FieldMetadata<string | undefined>
  onChange?: () => void
}

/** The Plane workspace slug field, in the wizard and in the edit modal. */
export const PlaneWorkspaceField = ({ field, onChange }: Properties) => {
  const { t } = useTranslation('integrations')

  return (
    <fieldset className="fieldset">
      <label className="label" htmlFor={field.id}>
        {t('issueImporters.fields.workspace', { defaultValue: 'Workspace' })}
      </label>
      <Input
        {...getInputProps(field, { type: 'text' })}
        key={field.key}
        onChange={onChange}
        placeholder={t('issueImporters.fields.workspacePlaceholder', {
          defaultValue: 'e.g., my-company',
        })}
      />
      <FormFieldErrors errors={field.errors} />
      <p className="text-base-content/60 mt-1 text-xs">
        {t('issueImporters.fields.workspaceHelp', {
          defaultValue:
            'The workspace slug from your Plane URL (e.g., "my-company" from https://app.plane.so/my-company)',
        })}
      </p>
    </fieldset>
  )
}
