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

import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { useGithubResourceOwners } from '~/features/integrations/hooks/use-github-resource-owners'
import { type ImporterType } from '~/lib/utils/tag-helpers'

type Props = {
  accessTokenValue: string
  baseUrl: string
  fields: {
    resourceOwner: FieldMetadata<string | undefined>
    resourceOwnerType: FieldMetadata<string | undefined>
  }
  importerType: ImporterType
  selectedOrgId: string
}

export const GithubResourceOwnerField = ({
  accessTokenValue,
  baseUrl,
  fields,
  importerType,
  selectedOrgId,
}: Props) => {
  const { t } = useTranslation('integrations')
  const resourceOwnerControl = useInputControl(fields.resourceOwner)
  const resourceOwnerTypeControl = useInputControl(fields.resourceOwnerType)

  const { isLoadingResourceOwners, resourceOwners } = useGithubResourceOwners({
    accessToken: accessTokenValue,
    baseUrl,
    importerType,
    orgId: selectedOrgId,
  })

  return (
    <>
      <fieldset className="fieldset">
        <label className="label" htmlFor={fields.resourceOwner.id}>
          {t('issueImporters.fields.resourceOwner', {
            defaultValue: 'Resource Owner',
          })}
        </label>
        <input
          name={fields.resourceOwner.name}
          type="hidden"
          value={resourceOwnerControl.value ?? ''}
        />
        <select
          className="select select-bordered w-full"
          disabled={resourceOwners.length === 0 || isLoadingResourceOwners}
          id={fields.resourceOwner.id}
          onChange={(e) => {
            resourceOwnerControl.change(e.target.value)
            const selectedOwner = resourceOwners.find(
              (owner) => owner.id === e.target.value,
            )
            if (selectedOwner?.ownerType) {
              resourceOwnerTypeControl.change(selectedOwner.ownerType)
            }
          }}
          value={resourceOwnerControl.value || ''}
        >
          <option disabled value="">
            {isLoadingResourceOwners
              ? t('issueImporters.fields.resourceOwnerLoading', {
                  defaultValue: 'Loading organizations...',
                })
              : resourceOwners.length === 0 && !accessTokenValue
                ? t('issueImporters.fields.resourceOwnerPlaceholder', {
                    defaultValue:
                      'Enter access token above to load organizations',
                  })
                : resourceOwners.length === 0
                  ? t('issueImporters.fields.resourceOwnerNoResults', {
                      defaultValue: 'No organizations found',
                    })
                  : t('issueImporters.fields.resourceOwnerSelect', {
                      defaultValue: 'Select an organization',
                    })}
          </option>
          {resourceOwners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>
        <FormFieldErrors errors={fields.resourceOwner.errors} />
        <p className="text-base-content/60 mt-1 text-xs">
          {t('issueImporters.fields.resourceOwnerHelp', {
            defaultValue:
              'Select the GitHub user or organization that owns the repositories you want to access.',
          })}
        </p>
      </fieldset>
      <input
        name={fields.resourceOwnerType.name}
        type="hidden"
        value={resourceOwnerTypeControl.value ?? ''}
      />
    </>
  )
}
