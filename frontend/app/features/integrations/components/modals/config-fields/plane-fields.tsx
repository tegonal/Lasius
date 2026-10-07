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

import { PlaneWorkspaceField } from './plane-workspace-field'

type Properties = {
  fields: {
    apiKey: FieldMetadata<string | undefined>
    workspace: FieldMetadata<string | undefined>
  }
  resetTestState: () => void
}

export const PlaneFields = ({ fields, resetTestState }: Properties) => {
  const { t } = useTranslation('integrations')

  return (
    <>
      <fieldset className="fieldset">
        <label className="label" htmlFor={fields.apiKey.id}>
          {t('issueImporters.fields.apiKeyEdit', {
            defaultValue: 'API Key (leave empty to keep current)',
          })}
        </label>
        <Input
          {...getInputProps(fields.apiKey, { type: 'password' })}
          autoComplete="off"
          data-1p-ignore
          data-form-type="other"
          data-lpignore="true"
          key={fields.apiKey.key}
          onChange={() => {
            resetTestState()
          }}
          placeholder={t('issueImporters.fields.credentialPlaceholder', {
            defaultValue: 'Enter new value to update',
          })}
        />
        <FormFieldErrors errors={fields.apiKey.errors} />
      </fieldset>

      <PlaneWorkspaceField
        field={fields.workspace}
        onChange={() => {
          resetTestState()
        }}
      />
    </>
  )
}
