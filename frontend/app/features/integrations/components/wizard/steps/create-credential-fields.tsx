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
import { ModalHelpButton } from '~/features/help/components/help-button'
import {
  AccessTokenInput,
  noPasswordManager,
} from '~/features/integrations/components/modals/config-fields/access-token-input'
import { GithubResourceOwnerField } from '~/features/integrations/components/modals/config-fields/github-resource-owner-field'
import { type InputControl } from '~/features/integrations/components/modals/config-fields/jira-credential-fields'
import { PlaneWorkspaceField } from '~/features/integrations/components/modals/config-fields/plane-workspace-field'
import { type ImporterType } from '~/lib/utils/tag-helpers'

// The PEM header is a fixed format marker, so it stays untranslated.
const PEM_KEY_PLACEHOLDER = '-----BEGIN RSA PRIVATE KEY-----'

type CreateCredentialFieldsProperties = {
  accessTokenControl: InputControl
  baseUrl: string
  fields: {
    accessToken: CredentialField
    apiKey: CredentialField
    consumerKey: CredentialField
    privateKey: CredentialField
    resourceOwner: CredentialField
    resourceOwnerType: CredentialField
    workspace: CredentialField
  }
  importerType: ImporterType
  selectedOrgId: string
}

type CredentialField = FieldMetadata<string | undefined>

/**
 * The platform-specific credential fields of the integration wizard, in create mode. The edit modal
 * uses the components in `modals/config-fields/` instead.
 */
export const CreateCredentialFields = ({
  accessTokenControl,
  baseUrl,
  fields,
  importerType,
  selectedOrgId,
}: CreateCredentialFieldsProperties) => {
  const { t } = useTranslation('integrations')

  if (importerType === 'github' || importerType === 'gitlab') {
    return (
      <>
        <fieldset className="fieldset">
          <div className="flex items-center gap-1">
            <label className="label" htmlFor={fields.accessToken.id}>
              {t('issueImporters.fields.accessToken', { defaultValue: 'Access Token' })}
            </label>
            <ModalHelpButton helpKey={`setup-${importerType}`} />
          </div>
          <AccessTokenInput
            control={accessTokenControl}
            field={fields.accessToken}
            placeholder={
              importerType === 'github' ? 'github_pat_xxxxxxxxxxxxx' : 'glpat-xxxxxxxxxxxxx'
            }
          />
        </fieldset>
        {importerType === 'github' && (
          <GithubResourceOwnerField
            accessTokenValue={accessTokenControl.value ?? ''}
            baseUrl={baseUrl}
            fields={{
              resourceOwner: fields.resourceOwner,
              resourceOwnerType: fields.resourceOwnerType,
            }}
            importerType={importerType}
            selectedOrgId={selectedOrgId}
          />
        )}
      </>
    )
  }

  if (importerType === 'jira') {
    return (
      <>
        <fieldset className="fieldset">
          <div className="flex items-center gap-1">
            <label className="label" htmlFor={fields.consumerKey.id}>
              {t('issueImporters.fields.consumerKey', { defaultValue: 'OAuth Consumer Key' })}
            </label>
            <ModalHelpButton helpKey="setup-jira" />
          </div>
          <Input
            {...getInputProps(fields.consumerKey, { type: 'text' })}
            key={fields.consumerKey.key}
            placeholder="jira-oauth-consumer"
          />
          <FormFieldErrors errors={fields.consumerKey.errors} />
        </fieldset>

        <fieldset className="fieldset">
          <label className="label" htmlFor={fields.privateKey.id}>
            {t('issueImporters.fields.privateKey', { defaultValue: 'OAuth Private Key' })}
          </label>
          <textarea
            {...noPasswordManager}
            className="textarea textarea-bordered w-full font-mono text-sm"
            id={fields.privateKey.id}
            key={fields.privateKey.key}
            name={fields.privateKey.name}
            placeholder={PEM_KEY_PLACEHOLDER}
            rows={4}
          />
          <FormFieldErrors errors={fields.privateKey.errors} />
        </fieldset>

        <fieldset className="fieldset">
          <label className="label" htmlFor={fields.accessToken.id}>
            {t('issueImporters.fields.oauthAccessToken', { defaultValue: 'OAuth Access Token' })}
          </label>
          <AccessTokenInput
            control={accessTokenControl}
            field={fields.accessToken}
            placeholder="your-oauth-access-token"
          />
        </fieldset>
      </>
    )
  }

  return (
    <>
      <fieldset className="fieldset">
        <div className="flex items-center gap-1">
          <label className="label" htmlFor={fields.apiKey.id}>
            {t('issueImporters.fields.apiKey', { defaultValue: 'API Key' })}
          </label>
          <ModalHelpButton helpKey="setup-plane" />
        </div>
        <Input
          {...getInputProps(fields.apiKey, { type: 'password' })}
          {...noPasswordManager}
          key={fields.apiKey.key}
          placeholder="plane-api-key-xxxxxxxxxxxxx"
        />
        <FormFieldErrors errors={fields.apiKey.errors} />
      </fieldset>

      <PlaneWorkspaceField field={fields.workspace} />
    </>
  )
}
