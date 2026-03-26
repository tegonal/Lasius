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
import { type Dispatch, type SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/primitives/inputs/input'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'

type InputControl = {
  blur: () => void
  change: Dispatch<SetStateAction<string | undefined>>
  focus: () => void
  value: string | undefined
}

type Props = {
  accessTokenControl: InputControl
  fields: {
    accessToken: FieldMetadata<string | undefined>
    consumerKey: FieldMetadata<string | undefined>
    privateKey: FieldMetadata<string | undefined>
  }
  resetTestState: () => void
}

export const JiraCredentialFields = ({
  accessTokenControl,
  fields,
  resetTestState,
}: Props) => {
  const { t } = useTranslation('integrations')

  return (
    <>
      <fieldset className="fieldset">
        <label className="label" htmlFor={fields.consumerKey.id}>
          {t('issueImporters.fields.consumerKey', {
            defaultValue: 'OAuth Consumer Key',
          })}
        </label>
        <Input
          {...getInputProps(fields.consumerKey, { type: 'text' })}
          key={fields.consumerKey.key}
          placeholder="jira-oauth-consumer"
        />
        <FormFieldErrors errors={fields.consumerKey.errors} />
      </fieldset>

      <fieldset className="fieldset">
        <label className="label" htmlFor={fields.privateKey.id}>
          {t('issueImporters.fields.privateKeyEdit', {
            defaultValue: 'Private Key (leave empty to keep current)',
          })}
        </label>
        <textarea
          autoComplete="off"
          className="textarea textarea-bordered w-full font-mono text-sm"
          data-1p-ignore
          data-form-type="other"
          data-lpignore="true"
          id={fields.privateKey.id}
          key={fields.privateKey.key}
          name={fields.privateKey.name}
          onChange={(e) => {
            resetTestState()
            // Conform workaround: dispatch native input event to update form state
            e.target.dispatchEvent(new Event('input', { bubbles: true }))
          }}
          placeholder={t('issueImporters.fields.credentialPlaceholder', {
            defaultValue: 'Enter new value to update',
          })}
          rows={4}
        />
        <FormFieldErrors errors={fields.privateKey.errors} />
      </fieldset>

      <fieldset className="fieldset">
        <label className="label" htmlFor={fields.accessToken.id}>
          {t('issueImporters.fields.accessTokenEdit', {
            defaultValue: 'Access Token (leave empty to keep current)',
          })}
        </label>
        <Input
          {...getInputProps(fields.accessToken, {
            type: 'password',
          })}
          autoComplete="off"
          data-1p-ignore
          data-form-type="other"
          data-lpignore="true"
          key={fields.accessToken.key}
          onChange={(e) => {
            accessTokenControl.change(e.target.value)
            resetTestState()
          }}
          placeholder={t('issueImporters.fields.credentialPlaceholder', {
            defaultValue: 'Enter new value to update',
          })}
        />
        <FormFieldErrors errors={fields.accessToken.errors} />
      </fieldset>
    </>
  )
}
