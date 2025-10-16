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

import { zodResolver } from '@hookform/resolvers/zod'
import { createConfigSchema } from 'components/features/issue-importers/lib/configSchemas'
import { useGithubResourceOwners } from 'components/features/issue-importers/lib/useGithubResourceOwners'
import { ProviderInstructions } from 'components/features/issue-importers/shared/ProviderInstructions'
import { getImporterTypeLabel } from 'components/features/issue-importers/shared/types'
import { Input } from 'components/primitives/inputs/Input'
import { Heading } from 'components/primitives/typography/Heading'
import { Label } from 'components/primitives/typography/Label'
import { Text } from 'components/primitives/typography/Text'
import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { DurationInput } from 'components/ui/forms/input/DurationInput'
import { Select } from 'components/ui/forms/input/Select'
import { useTranslation } from 'next-i18next'
import React, { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

import type { WizardFormData } from '../useWizardState'
import type { ImporterType } from 'components/features/issue-importers/shared/types'

type Props = {
  importerType: ImporterType
  initialData: WizardFormData
  onSubmit: (data: WizardFormData) => void
  orgId: string
}

export const ConfigFormStep: React.FC<Props> = ({ importerType, initialData, onSubmit, orgId }) => {
  const { t } = useTranslation('integrations')
  const schema = useMemo(() => createConfigSchema(t, importerType, false), [t, importerType])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: initialData,
  })

  const watchCheckFrequency = watch('checkFrequency')
  const watchAccessToken = watch('accessToken')
  const watchBaseUrl = watch('baseUrl')

  // GitHub resource owners hook - fetches when token and URL are present
  const { resourceOwners, isLoading: isLoadingResourceOwners } = useGithubResourceOwners(
    importerType === 'github' ? orgId : '',
    importerType === 'github' ? watchAccessToken : undefined,
    importerType === 'github' ? watchBaseUrl : undefined,
  )

  return (
    <div className="flex h-full flex-col">
      <Heading variant="section">
        {t('issueImporters.wizard.config.title', {
          defaultValue: 'Configure {{platform}}',
          platform: getImporterTypeLabel(importerType, t),
        })}
      </Heading>
      <Text variant="infoText" className="mt-2">
        {t('issueImporters.wizard.config.description', {
          defaultValue: 'Enter your connection details to connect to {{platform}}.',
          platform: getImporterTypeLabel(importerType, t),
        })}
      </Text>

      <div className="mt-6 grid flex-1 grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left column: Form fields */}
        <form
          onSubmit={handleSubmit((data) => {
            onSubmit(data as WizardFormData)
          })}>
          <FormBody>
            {/* Common fields */}
            <FormElement>
              <Label htmlFor="name">
                {t('issueImporters.fields.name', { defaultValue: 'Configuration Name' })}
              </Label>
              <Input
                {...register('name')}
                id="name"
                placeholder={t(`issueImporters.fields.namePlaceholder.${importerType}`, {
                  defaultValue: `e.g., Company ${getImporterTypeLabel(importerType, t)}`,
                })}
                autoFocus
              />
              {errors.name && <FormErrorBadge error={errors.name} />}
            </FormElement>

            <FormElement>
              <Label htmlFor="baseUrl">
                {t('issueImporters.fields.baseUrl', { defaultValue: 'Base URL' })}
              </Label>
              <Input
                {...register('baseUrl')}
                id="baseUrl"
                placeholder={t(`issueImporters.fields.baseUrlPlaceholder.${importerType}`, {
                  defaultValue: 'https://...',
                })}
              />
              {errors.baseUrl && <FormErrorBadge error={errors.baseUrl} />}
            </FormElement>

            {/* Platform-specific credential fields */}
            {(importerType === 'github' || importerType === 'gitlab') && (
              <FormElement>
                <Label htmlFor="accessToken">
                  {t('issueImporters.fields.accessToken', { defaultValue: 'Access Token' })}
                </Label>
                <Input
                  {...register('accessToken')}
                  id="accessToken"
                  type="password"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  placeholder={
                    importerType === 'github' ? 'github_pat_xxxxxxxxxxxxx' : 'glpat-xxxxxxxxxxxxx'
                  }
                />
                {errors.accessToken && <FormErrorBadge error={errors.accessToken} />}
              </FormElement>
            )}

            {/* GitHub resource owner dropdown */}
            {importerType === 'github' && (
              <>
                <FormElement>
                  <Label htmlFor="resourceOwner">
                    {t('issueImporters.fields.resourceOwner', {
                      defaultValue: 'Resource Owner',
                    })}
                  </Label>
                  <Controller
                    name="resourceOwner"
                    control={control}
                    render={({ field }) => (
                      <Select
                        id="resourceOwner"
                        name="resourceOwner"
                        value={field.value || ''}
                        onChange={(value) => {
                          field.onChange(value)
                          // Also store the resource owner type when selection changes
                          const selectedOwner = resourceOwners.find((owner) => owner.id === value)
                          if (selectedOwner?.ownerType) {
                            setValue('resourceOwnerType', selectedOwner.ownerType, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                        }}
                        options={resourceOwners.map((owner) => ({
                          value: owner.id,
                          label: owner.name,
                        }))}
                        placeholder={
                          isLoadingResourceOwners
                            ? t('issueImporters.fields.resourceOwnerLoading', {
                                defaultValue: 'Loading organizations...',
                              })
                            : resourceOwners.length === 0 && !watchAccessToken
                              ? t('issueImporters.fields.resourceOwnerPlaceholder', {
                                  defaultValue: 'Enter access token above to load organizations',
                                })
                              : resourceOwners.length === 0
                                ? t('issueImporters.fields.resourceOwnerNoResults', {
                                    defaultValue: 'No organizations found',
                                  })
                                : t('issueImporters.fields.resourceOwnerSelect', {
                                    defaultValue: 'Select an organization',
                                  })
                        }
                        disabled={resourceOwners.length === 0 || isLoadingResourceOwners}
                      />
                    )}
                  />
                  {errors.resourceOwner && <FormErrorBadge error={errors.resourceOwner} />}
                  <p className="text-base-content/60 mt-1 text-xs">
                    {t('issueImporters.fields.resourceOwnerHelp', {
                      defaultValue:
                        'Select the GitHub user or organization that owns the repositories you want to access.',
                    })}
                  </p>
                </FormElement>
                {/* Hidden field for resourceOwnerType - set via setValue */}
                <input type="hidden" {...register('resourceOwnerType')} />
              </>
            )}

            {importerType === 'jira' && (
              <>
                <FormElement>
                  <Label htmlFor="consumerKey">
                    {t('issueImporters.fields.consumerKey', { defaultValue: 'OAuth Consumer Key' })}
                  </Label>
                  <Input
                    {...register('consumerKey')}
                    id="consumerKey"
                    placeholder="jira-oauth-consumer"
                  />
                  {errors.consumerKey && <FormErrorBadge error={errors.consumerKey} />}
                </FormElement>

                <FormElement>
                  <Label htmlFor="privateKey">
                    {t('issueImporters.fields.privateKey', { defaultValue: 'OAuth Private Key' })}
                  </Label>
                  <Input
                    {...register('privateKey')}
                    id="privateKey"
                    type="password"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="-----BEGIN RSA PRIVATE KEY-----"
                  />
                  {errors.privateKey && <FormErrorBadge error={errors.privateKey} />}
                </FormElement>

                <FormElement>
                  <Label htmlFor="accessToken">
                    {t('issueImporters.fields.oauthAccessToken', {
                      defaultValue: 'OAuth Access Token',
                    })}
                  </Label>
                  <Input
                    {...register('accessToken')}
                    id="accessToken"
                    type="password"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="your-oauth-access-token"
                  />
                  {errors.accessToken && <FormErrorBadge error={errors.accessToken} />}
                </FormElement>
              </>
            )}

            {importerType === 'plane' && (
              <>
                <FormElement>
                  <Label htmlFor="apiKey">
                    {t('issueImporters.fields.apiKey', { defaultValue: 'API Key' })}
                  </Label>
                  <Input
                    {...register('apiKey')}
                    id="apiKey"
                    type="password"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="plane-api-key-xxxxxxxxxxxxx"
                  />
                  {errors.apiKey && <FormErrorBadge error={errors.apiKey} />}
                </FormElement>

                <FormElement>
                  <Label htmlFor="workspace">
                    {t('issueImporters.fields.workspace', { defaultValue: 'Workspace' })}
                  </Label>
                  <Input
                    {...register('workspace')}
                    id="workspace"
                    placeholder={t('issueImporters.fields.workspacePlaceholder', {
                      defaultValue: 'e.g., my-company',
                    })}
                  />
                  {errors.workspace && <FormErrorBadge error={errors.workspace} />}
                  <p className="text-base-content/60 mt-1 text-xs">
                    {t('issueImporters.fields.workspaceHelp', {
                      defaultValue:
                        'The workspace slug from your Plane URL (e.g., "my-company" from https://app.plane.so/my-company)',
                    })}
                  </p>
                </FormElement>
              </>
            )}

            <FormElement>
              <div className="flex flex-col gap-2">
                <Label htmlFor="checkFrequency">
                  {t('issueImporters.checkInterval', { defaultValue: 'Check Interval' })}
                </Label>
                <div>
                  <DurationInput
                    id="checkFrequency"
                    value={watchCheckFrequency}
                    onChange={(ms) => setValue('checkFrequency', ms, { shouldValidate: true })}
                    error={!!errors.checkFrequency}
                  />
                </div>
              </div>
              {errors.checkFrequency && <FormErrorBadge error={errors.checkFrequency} />}
              <p className="text-base-content/60 mt-1 text-xs">
                {t('issueImporters.checkIntervalHelp', {
                  defaultValue: 'How often to check for new issues',
                })}
              </p>
            </FormElement>
          </FormBody>

          {/* Hidden submit button - form will be submitted by wizard navigation */}
          <button type="submit" className="hidden" />
        </form>

        {/* Right column: Platform-specific instructions */}
        <div className="hidden lg:block">
          <ProviderInstructions importerType={importerType} />
        </div>
      </div>
    </div>
  )
}
