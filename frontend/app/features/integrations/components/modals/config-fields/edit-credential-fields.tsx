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
import { useTranslation } from 'react-i18next'

import { ModalHelpButton } from '~/features/help/components/help-button'
import { AccessTokenInput } from '~/features/integrations/components/modals/config-fields/access-token-input'
import { GithubResourceOwnerField } from '~/features/integrations/components/modals/config-fields/github-resource-owner-field'
import {
  type InputControl,
  JiraCredentialFields,
} from '~/features/integrations/components/modals/config-fields/jira-credential-fields'
import { PlaneFields } from '~/features/integrations/components/modals/config-fields/plane-fields'
import { type ImporterType } from '~/lib/utils/tag-helpers'

type CredentialField = FieldMetadata<string | undefined>

type EditCredentialFieldsProperties = {
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
  resetTestState: () => void
  selectedOrgId: string
}

// In the edit form an empty credential keeps the stored secret, so the fields are optional.
export const EditCredentialFields = ({
  accessTokenControl,
  baseUrl,
  fields,
  importerType,
  resetTestState,
  selectedOrgId,
}: EditCredentialFieldsProperties) => {
  const { t } = useTranslation('integrations')

  return (
    <>
      {(importerType === 'github' || importerType === 'gitlab') && (
        <fieldset className="fieldset">
          <div className="flex items-center gap-1">
            <label className="label" htmlFor={fields.accessToken.id}>
              {t('issueImporters.fields.accessTokenEdit', {
                defaultValue: 'Access Token (leave empty to keep current)',
              })}
            </label>
            <ModalHelpButton helpKey={`setup-${importerType}`} />
          </div>
          <AccessTokenInput
            control={accessTokenControl}
            field={fields.accessToken}
            onValueChange={resetTestState}
            placeholder={t('issueImporters.fields.credentialPlaceholder', {
              defaultValue: 'Enter new value to update',
            })}
          />
        </fieldset>
      )}

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

      {importerType === 'jira' && (
        <div>
          <div className="mb-2 flex items-center gap-1">
            <span className="label">
              {t('issueImporters.jira.credentialsLabel', { defaultValue: 'Jira Credentials' })}
            </span>
            <ModalHelpButton helpKey="setup-jira" />
          </div>
          <JiraCredentialFields
            accessTokenControl={accessTokenControl}
            fields={{
              accessToken: fields.accessToken,
              consumerKey: fields.consumerKey,
              privateKey: fields.privateKey,
            }}
            resetTestState={resetTestState}
          />
        </div>
      )}

      {importerType === 'plane' && (
        <div>
          <div className="mb-2 flex items-center gap-1">
            <span className="label">
              {t('issueImporters.plane.credentialsLabel', { defaultValue: 'Plane Credentials' })}
            </span>
            <ModalHelpButton helpKey="setup-plane" />
          </div>
          <PlaneFields
            fields={{ apiKey: fields.apiKey, workspace: fields.workspace }}
            resetTestState={resetTestState}
          />
        </div>
      )}
    </>
  )
}
