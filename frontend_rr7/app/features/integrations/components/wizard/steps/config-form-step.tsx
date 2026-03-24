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
import { useCallback, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/primitives/inputs/input'
import { DurationInput } from '~/components/ui/forms/input/duration-input'
import { ProviderInstructions } from '~/features/integrations/components/shared/provider-instructions'
import { type WizardFormData } from '~/features/integrations/hooks/use-wizard-state'
import { createConfigSchema } from '~/features/integrations/lib/config-schemas'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import { useListGithubResourceOwners } from '~/services/api/lasius-hooks/issue-importers/issue-importers'

type Props = {
  formData: WizardFormData
  formRef: React.RefObject<HTMLFormElement | null>
  onSubmit: (data: WizardFormData) => void
  selectedOrgId: string
}

const getImporterTypeLabel = (type: ImporterType): string => {
  switch (type) {
    case 'github':
      return 'GitHub'
    case 'gitlab':
      return 'GitLab'
    case 'jira':
      return 'Jira'
    case 'plane':
      return 'Plane'
  }
}

export const ConfigFormStep = ({
  formData,
  formRef,
  onSubmit,
  selectedOrgId,
}: Props) => {
  const { t } = useTranslation('integrations')
  const importerType = formData.importerType as ImporterType

  const schema = useMemo(
    () => createConfigSchema(t, importerType, false),
    [t, importerType],
  )

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm({
    defaultValues: formData,

    resolver: zodResolver(schema) as any,
  })

  const watchCheckFrequency = watch('checkFrequency')
  const watchAccessToken = watch('accessToken')

  // GitHub resource owners — mutation hook, submit when token is present
  const {
    data: resourceOwnersData,
    isLoading: isLoadingResourceOwners,
    submit: submitResourceOwners,
  } = useListGithubResourceOwners()

  const resourceOwners = useMemo(
    () => resourceOwnersData?.projects ?? [],
    [resourceOwnersData],
  )

  // Fetch resource owners when access token changes for GitHub
  useEffect(() => {
    if (
      importerType === 'github' &&
      watchAccessToken &&
      watchAccessToken.length > 0
    ) {
      submitResourceOwners({
        body: {
          accessToken: watchAccessToken,
          baseUrl: formData.baseUrl,
        } as never,
        orgId: selectedOrgId,
      })
    }
  }, [
    importerType,
    watchAccessToken,
    formData.baseUrl,
    selectedOrgId,
    submitResourceOwners,
  ])

  const handleFormSubmit = useCallback(
    (data: Record<string, unknown>) => {
      onSubmit({ ...formData, ...data } as WizardFormData)
    },
    [formData, onSubmit],
  )

  return (
    <div className="flex h-full flex-col">
      <h3 className="text-base font-semibold">
        {t('issueImporters.wizard.config.title', {
          defaultValue: `Configure ${getImporterTypeLabel(importerType)}`,
        })}
      </h3>
      <p className="text-base-content/60 mt-1 text-sm">
        {t('issueImporters.wizard.config.description', {
          defaultValue: `Enter your connection details to connect to ${getImporterTypeLabel(importerType)}.`,
        })}
      </p>

      <div className="mt-6 grid flex-1 grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left column: Form fields */}
        <form
          className="space-y-4"
          onSubmit={handleSubmit(handleFormSubmit)}
          ref={formRef}
        >
          {/* Name */}
          <fieldset className="fieldset">
            <label className="label" htmlFor="name">
              {t('issueImporters.fields.name', {
                defaultValue: 'Configuration Name',
              })}
            </label>
            <Input
              {...register('name')}
              autoFocus
              id="name"
              placeholder={t(
                `issueImporters.fields.namePlaceholder.${importerType}`,
                {
                  defaultValue: `e.g., Company ${getImporterTypeLabel(importerType)}`,
                },
              )}
            />
            {errors.name && (
              <p className="text-error text-xs">{errors.name.message}</p>
            )}
          </fieldset>

          {/* Base URL */}
          <fieldset className="fieldset">
            <label className="label" htmlFor="baseUrl">
              {t('issueImporters.fields.baseUrl', {
                defaultValue: 'Base URL',
              })}
            </label>
            <Input
              {...register('baseUrl')}
              id="baseUrl"
              placeholder={t(
                `issueImporters.fields.baseUrlPlaceholder.${importerType}`,
                { defaultValue: 'https://...' },
              )}
            />
            {errors.baseUrl && (
              <p className="text-error text-xs">{errors.baseUrl.message}</p>
            )}
          </fieldset>

          {/* GitHub / GitLab: Access Token */}
          {(importerType === 'github' || importerType === 'gitlab') && (
            <fieldset className="fieldset">
              <label className="label" htmlFor="accessToken">
                {t('issueImporters.fields.accessToken', {
                  defaultValue: 'Access Token',
                })}
              </label>
              <Input
                {...register('accessToken')}
                autoComplete="off"
                data-1p-ignore
                data-form-type="other"
                data-lpignore="true"
                id="accessToken"
                placeholder={
                  importerType === 'github'
                    ? 'github_pat_xxxxxxxxxxxxx'
                    : 'glpat-xxxxxxxxxxxxx'
                }
                type="password"
              />
              {errors.accessToken && (
                <p className="text-error text-xs">
                  {errors.accessToken.message}
                </p>
              )}
            </fieldset>
          )}

          {/* GitHub: Resource Owner */}
          {importerType === 'github' && (
            <>
              <fieldset className="fieldset">
                <label className="label" htmlFor="resourceOwner">
                  {t('issueImporters.fields.resourceOwner', {
                    defaultValue: 'Resource Owner',
                  })}
                </label>
                <Controller
                  control={control}
                  name="resourceOwner"
                  render={({ field }) => (
                    <select
                      className="select select-bordered w-full"
                      disabled={
                        resourceOwners.length === 0 || isLoadingResourceOwners
                      }
                      id="resourceOwner"
                      onChange={(e) => {
                        field.onChange(e.target.value)
                        const selectedOwner = resourceOwners.find(
                          (owner) => owner.id === e.target.value,
                        )
                        if (selectedOwner?.ownerType) {
                          setValue(
                            'resourceOwnerType',
                            selectedOwner.ownerType as never,
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            },
                          )
                        }
                      }}
                      value={field.value || ''}
                    >
                      <option disabled value="">
                        {isLoadingResourceOwners
                          ? t('issueImporters.fields.resourceOwnerLoading', {
                              defaultValue: 'Loading organizations...',
                            })
                          : resourceOwners.length === 0 && !watchAccessToken
                            ? t(
                                'issueImporters.fields.resourceOwnerPlaceholder',
                                {
                                  defaultValue:
                                    'Enter access token above to load organizations',
                                },
                              )
                            : resourceOwners.length === 0
                              ? t(
                                  'issueImporters.fields.resourceOwnerNoResults',
                                  { defaultValue: 'No organizations found' },
                                )
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
                  )}
                />
                {errors.resourceOwner && (
                  <p className="text-error text-xs">
                    {errors.resourceOwner.message}
                  </p>
                )}
                <p className="text-base-content/60 mt-1 text-xs">
                  {t('issueImporters.fields.resourceOwnerHelp', {
                    defaultValue:
                      'Select the GitHub user or organization that owns the repositories you want to access.',
                  })}
                </p>
              </fieldset>
              <input type="hidden" {...register('resourceOwnerType')} />
            </>
          )}

          {/* Jira fields */}
          {importerType === 'jira' && (
            <>
              <fieldset className="fieldset">
                <label className="label" htmlFor="consumerKey">
                  {t('issueImporters.fields.consumerKey', {
                    defaultValue: 'OAuth Consumer Key',
                  })}
                </label>
                <Input
                  {...register('consumerKey')}
                  id="consumerKey"
                  placeholder="jira-oauth-consumer"
                />
                {errors.consumerKey && (
                  <p className="text-error text-xs">
                    {errors.consumerKey.message}
                  </p>
                )}
              </fieldset>

              <fieldset className="fieldset">
                <label className="label" htmlFor="privateKey">
                  {t('issueImporters.fields.privateKey', {
                    defaultValue: 'OAuth Private Key',
                  })}
                </label>
                <textarea
                  {...register('privateKey')}
                  autoComplete="off"
                  className="textarea textarea-bordered w-full font-mono text-sm"
                  data-1p-ignore
                  data-form-type="other"
                  data-lpignore="true"
                  id="privateKey"
                  placeholder="-----BEGIN RSA PRIVATE KEY-----"
                  rows={4}
                />
                {errors.privateKey && (
                  <p className="text-error text-xs">
                    {errors.privateKey.message}
                  </p>
                )}
              </fieldset>

              <fieldset className="fieldset">
                <label className="label" htmlFor="accessToken">
                  {t('issueImporters.fields.oauthAccessToken', {
                    defaultValue: 'OAuth Access Token',
                  })}
                </label>
                <Input
                  {...register('accessToken')}
                  autoComplete="off"
                  data-1p-ignore
                  data-form-type="other"
                  data-lpignore="true"
                  id="accessToken"
                  placeholder="your-oauth-access-token"
                  type="password"
                />
                {errors.accessToken && (
                  <p className="text-error text-xs">
                    {errors.accessToken.message}
                  </p>
                )}
              </fieldset>
            </>
          )}

          {/* Plane fields */}
          {importerType === 'plane' && (
            <>
              <fieldset className="fieldset">
                <label className="label" htmlFor="apiKey">
                  {t('issueImporters.fields.apiKey', {
                    defaultValue: 'API Key',
                  })}
                </label>
                <Input
                  {...register('apiKey')}
                  autoComplete="off"
                  data-1p-ignore
                  data-form-type="other"
                  data-lpignore="true"
                  id="apiKey"
                  placeholder="plane-api-key-xxxxxxxxxxxxx"
                  type="password"
                />
                {errors.apiKey && (
                  <p className="text-error text-xs">{errors.apiKey.message}</p>
                )}
              </fieldset>

              <fieldset className="fieldset">
                <label className="label" htmlFor="workspace">
                  {t('issueImporters.fields.workspace', {
                    defaultValue: 'Workspace',
                  })}
                </label>
                <Input
                  {...register('workspace')}
                  id="workspace"
                  placeholder={t('issueImporters.fields.workspacePlaceholder', {
                    defaultValue: 'e.g., my-company',
                  })}
                />
                {errors.workspace && (
                  <p className="text-error text-xs">
                    {errors.workspace.message}
                  </p>
                )}
                <p className="text-base-content/60 mt-1 text-xs">
                  {t('issueImporters.fields.workspaceHelp', {
                    defaultValue:
                      'The workspace slug from your Plane URL (e.g., "my-company" from https://app.plane.so/my-company)',
                  })}
                </p>
              </fieldset>
            </>
          )}

          {/* Check Frequency */}
          <fieldset className="fieldset">
            <label className="label" htmlFor="checkFrequency">
              {t('issueImporters.checkInterval', {
                defaultValue: 'Check Interval',
              })}
            </label>
            <div>
              <DurationInput
                error={!!errors.checkFrequency}
                id="checkFrequency"
                onChange={(ms) =>
                  setValue('checkFrequency', ms, { shouldValidate: true })
                }
                value={watchCheckFrequency}
              />
            </div>
            {errors.checkFrequency && (
              <p className="text-error text-xs">
                {errors.checkFrequency.message}
              </p>
            )}
            <p className="text-base-content/60 mt-1 text-xs">
              {t('issueImporters.checkIntervalHelp', {
                defaultValue: 'How often to check for new issues',
              })}
            </p>
          </fieldset>
        </form>

        {/* Right column: Platform-specific instructions */}
        <div className="hidden md:block">
          <ProviderInstructions importerType={importerType} />
        </div>
      </div>
    </div>
  )
}
