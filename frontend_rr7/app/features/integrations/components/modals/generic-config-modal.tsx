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
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { Input } from '~/components/primitives/inputs/input'
import { DurationInput } from '~/components/ui/forms/input/duration-input'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { ProviderInstructions } from '~/features/integrations/components/shared/provider-instructions'
import { createConfigSchema } from '~/features/integrations/lib/config-schemas'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import {
  useListGithubResourceOwners,
  useTestConnectivity,
  useTestExistingConfig,
  useUpdateConfig,
} from '~/services/api/lasius-hooks/issue-importers/issue-importers'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius/modelsIssueImporterConfigResponse'
import { type ModelsUpdateIssueImporterConfig } from '~/services/api/lasius/modelsUpdateIssueImporterConfig'

type Props = {
  config: ModelsIssueImporterConfigResponse | null
  onClose: () => void
  open: boolean
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

const getImporterType = (
  config: ModelsIssueImporterConfigResponse,
): ImporterType => {
  if ('importerType' in config) {
    const raw = config.importerType as string
    const normalized = raw.replace(/Config$/, '').toLowerCase()
    if (
      normalized === 'github' ||
      normalized === 'gitlab' ||
      normalized === 'jira' ||
      normalized === 'plane'
    ) {
      return normalized
    }
  }
  return 'gitlab'
}

type ConnectionTestResult = 'error' | 'success' | null

export const GenericConfigModal = ({
  config,
  onClose,
  open,
  selectedOrgId,
}: Props) => {
  const { t } = useTranslation('integrations')
  const revalidator = useRevalidator()

  const [connectionTestResult, setConnectionTestResult] =
    useState<ConnectionTestResult>(null)
  const [connectionTestMessage, setConnectionTestMessage] = useState('')

  const importerType = config ? getImporterType(config) : 'gitlab'

  const schema = useMemo(
    () => createConfigSchema(t, importerType, true),
    [t, importerType],
  )

  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      accessToken: '',
      apiKey: '',
      baseUrl: '',
      checkFrequency: 300000,
      consumerKey: '',
      name: '',
      privateKey: '',
      resourceOwner: '',
      resourceOwnerType: null as null | string,
      workspace: '',
    },
    resolver: zodResolver(schema) as never,
  })

  const watchCheckFrequency = watch('checkFrequency')
  const watchAccessToken = watch('accessToken')

  // Reset form when config changes or modal opens
  useEffect(() => {
    if (config && open) {
      reset({
        accessToken: '',
        apiKey: '',
        baseUrl: String(config.baseUrl),
        checkFrequency: config.checkFrequency,
        consumerKey: '',
        name: config.name,
        privateKey: '',
        resourceOwner:
          (config as never as Record<string, string>).resourceOwner || '',
        resourceOwnerType:
          (config as never as Record<string, string>).resourceOwnerType || null,
        workspace: (config as never as Record<string, string>).workspace || '',
      })
      setConnectionTestResult(null)
      setConnectionTestMessage('')
    }
  }, [config, open, reset])

  // Clean up when modal closes
  useEffect(() => {
    if (!open) {
      setConnectionTestResult(null)
      setConnectionTestMessage('')
    }
  }, [open])

  // GitHub resource owners
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
          baseUrl: config?.baseUrl ?? '',
        } as never,
        orgId: selectedOrgId,
      })
    }
  }, [
    importerType,
    watchAccessToken,
    config?.baseUrl,
    selectedOrgId,
    submitResourceOwners,
  ])

  // Test connectivity hooks
  const testExistingApi = useTestExistingConfig({
    onError: (error) => {
      setConnectionTestResult('error')
      setConnectionTestMessage(
        error instanceof Error ? error.message : String(error),
      )
    },
    onSuccess: (data) => {
      setConnectionTestResult(data?.status === 'success' ? 'success' : 'error')
      setConnectionTestMessage(
        data?.message ??
          t('issueImporters.testConnection.success', {
            defaultValue: 'Connection successful',
          }),
      )
    },
  })

  const testConnectivityApi = useTestConnectivity({
    onError: (error) => {
      setConnectionTestResult('error')
      setConnectionTestMessage(
        error instanceof Error ? error.message : String(error),
      )
    },
    onSuccess: (data) => {
      setConnectionTestResult(data?.status === 'success' ? 'success' : 'error')
      setConnectionTestMessage(
        data?.message ??
          t('issueImporters.testConnection.success', {
            defaultValue: 'Connection successful',
          }),
      )
    },
  })

  const isTestingConnection =
    testExistingApi.isSubmitting || testConnectivityApi.isSubmitting

  // Update config hook
  const updateApi = useUpdateConfig({
    onSuccess: () => {
      onClose()
      void revalidator.revalidate()
    },
  })

  const isSaving = updateApi.isSubmitting

  const hasNewCredentials = useCallback(() => {
    const values = getValues()
    switch (importerType) {
      case 'github':
      case 'gitlab':
        return !!values.accessToken
      case 'jira':
        return (
          !!values.accessToken || !!values.consumerKey || !!values.privateKey
        )
      case 'plane':
        return !!values.apiKey
    }
  }, [getValues, importerType])

  const handleTestConnection = useCallback(() => {
    if (!config) return

    if (hasNewCredentials()) {
      // Test with new credentials
      const values = getValues()
      testConnectivityApi.submit({
        body: {
          accessToken: values.accessToken || undefined,
          apiKey: values.apiKey || undefined,
          baseUrl: values.baseUrl,
          checkFrequency: values.checkFrequency,
          consumerKey: values.consumerKey || undefined,
          importerType: importerType as never,
          name: values.name,
          privateKey: values.privateKey || undefined,
          resourceOwner: values.resourceOwner || undefined,
          resourceOwnerType: values.resourceOwnerType || undefined,
          workspace: values.workspace || undefined,
        } as never,
        orgId: selectedOrgId,
      })
    } else {
      // Test with existing saved credentials
      testExistingApi.submit({
        configId: config.id,
        orgId: selectedOrgId,
      })
    }
  }, [
    config,
    getValues,
    hasNewCredentials,
    importerType,
    selectedOrgId,
    testConnectivityApi,
    testExistingApi,
  ])

  const resetTestState = useCallback(() => {
    setConnectionTestResult(null)
    setConnectionTestMessage('')
  }, [])

  const onSubmit = useCallback(
    (data: Record<string, unknown>) => {
      if (!config) return

      const body: ModelsUpdateIssueImporterConfig = {
        baseUrl: data.baseUrl as string,
        checkFrequency: data.checkFrequency as number,
        name: data.name as string,
      }

      // Only include credential fields if changed (non-empty)
      if (data.accessToken) body.accessToken = data.accessToken as string
      if (data.consumerKey) body.consumerKey = data.consumerKey as string
      if (data.privateKey) body.privateKey = data.privateKey as string
      if (data.apiKey) body.apiKey = data.apiKey as string
      if (data.workspace) body.workspace = data.workspace as string
      if (data.resourceOwner) body.resourceOwner = data.resourceOwner as string
      if (data.resourceOwnerType)
        body.resourceOwnerType = data.resourceOwnerType as never

      updateApi.submit({
        body,
        configId: config.id,
        orgId: selectedOrgId,
      })
    },
    [config, selectedOrgId, updateApi],
  )

  if (!config) return null

  return (
    <Modal onClose={onClose} open={open} size="xl">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex-shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {t('issueImporters.titles.edit', {
                defaultValue: 'Edit Integration',
              })}
            </h3>
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={onClose}
              type="button"
            >
              &times;
            </button>
          </div>
          <p className="text-base-content/60 mb-6 text-sm">
            {t('issueImporters.descriptions.edit', {
              defaultValue:
                'Update the configuration for this issue importer integration.',
            })}
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid flex-1 grid-cols-1 gap-8 overflow-y-auto lg:grid-cols-2">
          {/* Left column: Form */}
          <form
            className="space-y-4"
            onSubmit={handleSubmit(onSubmit as never)}
          >
            {/* Name */}
            <fieldset className="fieldset">
              <label className="label" htmlFor="edit-name">
                {t('issueImporters.fields.name', {
                  defaultValue: 'Configuration Name',
                })}
              </label>
              <Input
                {...register('name')}
                autoFocus
                id="edit-name"
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
              <label className="label" htmlFor="edit-baseUrl">
                {t('issueImporters.fields.baseUrl', {
                  defaultValue: 'Base URL',
                })}
              </label>
              <Input
                {...register('baseUrl')}
                id="edit-baseUrl"
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
                <label className="label" htmlFor="edit-accessToken">
                  {t('issueImporters.fields.accessTokenEdit', {
                    defaultValue: 'Access Token (leave empty to keep current)',
                  })}
                </label>
                <Input
                  {...register('accessToken')}
                  autoComplete="off"
                  data-1p-ignore
                  data-form-type="other"
                  data-lpignore="true"
                  id="edit-accessToken"
                  onChange={(e) => {
                    void register('accessToken').onChange(e)
                    resetTestState()
                  }}
                  placeholder={t(
                    'issueImporters.fields.credentialPlaceholder',
                    { defaultValue: 'Enter new value to update' },
                  )}
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
                  <label className="label" htmlFor="edit-resourceOwner">
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
                        id="edit-resourceOwner"
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
                                    {
                                      defaultValue: 'No organizations found',
                                    },
                                  )
                                : t(
                                    'issueImporters.fields.resourceOwnerSelect',
                                    {
                                      defaultValue: 'Select an organization',
                                    },
                                  )}
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
                  <label className="label" htmlFor="edit-consumerKey">
                    {t('issueImporters.fields.consumerKey', {
                      defaultValue: 'OAuth Consumer Key',
                    })}
                  </label>
                  <Input
                    {...register('consumerKey')}
                    id="edit-consumerKey"
                    placeholder="jira-oauth-consumer"
                  />
                  {errors.consumerKey && (
                    <p className="text-error text-xs">
                      {errors.consumerKey.message}
                    </p>
                  )}
                </fieldset>

                <fieldset className="fieldset">
                  <label className="label" htmlFor="edit-privateKey">
                    {t('issueImporters.fields.privateKeyEdit', {
                      defaultValue: 'Private Key (leave empty to keep current)',
                    })}
                  </label>
                  <textarea
                    {...register('privateKey')}
                    autoComplete="off"
                    className="textarea textarea-bordered w-full font-mono text-sm"
                    data-1p-ignore
                    data-form-type="other"
                    data-lpignore="true"
                    id="edit-privateKey"
                    onChange={(e) => {
                      void register('privateKey').onChange(e)
                      resetTestState()
                    }}
                    placeholder={t(
                      'issueImporters.fields.credentialPlaceholder',
                      { defaultValue: 'Enter new value to update' },
                    )}
                    rows={4}
                  />
                  {errors.privateKey && (
                    <p className="text-error text-xs">
                      {errors.privateKey.message}
                    </p>
                  )}
                </fieldset>

                <fieldset className="fieldset">
                  <label className="label" htmlFor="edit-jira-accessToken">
                    {t('issueImporters.fields.accessTokenEdit', {
                      defaultValue:
                        'Access Token (leave empty to keep current)',
                    })}
                  </label>
                  <Input
                    {...register('accessToken')}
                    autoComplete="off"
                    data-1p-ignore
                    data-form-type="other"
                    data-lpignore="true"
                    id="edit-jira-accessToken"
                    onChange={(e) => {
                      void register('accessToken').onChange(e)
                      resetTestState()
                    }}
                    placeholder={t(
                      'issueImporters.fields.credentialPlaceholder',
                      { defaultValue: 'Enter new value to update' },
                    )}
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
                  <label className="label" htmlFor="edit-apiKey">
                    {t('issueImporters.fields.apiKeyEdit', {
                      defaultValue: 'API Key (leave empty to keep current)',
                    })}
                  </label>
                  <Input
                    {...register('apiKey')}
                    autoComplete="off"
                    data-1p-ignore
                    data-form-type="other"
                    data-lpignore="true"
                    id="edit-apiKey"
                    onChange={(e) => {
                      void register('apiKey').onChange(e)
                      resetTestState()
                    }}
                    placeholder={t(
                      'issueImporters.fields.credentialPlaceholder',
                      { defaultValue: 'Enter new value to update' },
                    )}
                    type="password"
                  />
                  {errors.apiKey && (
                    <p className="text-error text-xs">
                      {errors.apiKey.message}
                    </p>
                  )}
                </fieldset>

                <fieldset className="fieldset">
                  <label className="label" htmlFor="edit-workspace">
                    {t('issueImporters.fields.workspace', {
                      defaultValue: 'Workspace',
                    })}
                  </label>
                  <Input
                    {...register('workspace')}
                    id="edit-workspace"
                    onChange={(e) => {
                      void register('workspace').onChange(e)
                      resetTestState()
                    }}
                    placeholder={t(
                      'issueImporters.fields.workspacePlaceholder',
                      { defaultValue: 'e.g., my-company' },
                    )}
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
              <label className="label" htmlFor="edit-checkFrequency">
                {t('issueImporters.checkInterval', {
                  defaultValue: 'Check Interval',
                })}
              </label>
              <div>
                <DurationInput
                  error={!!errors.checkFrequency}
                  id="edit-checkFrequency"
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

            {/* Divider + Action buttons */}
            <div className="border-base-300 border-t pt-4">
              <div className="flex gap-2">
                <button
                  className="btn btn-primary"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving
                    ? t('actions.saving', { defaultValue: 'Saving...' })
                    : t('issueImporters.actions.update', {
                        defaultValue: 'Update',
                      })}
                </button>
                <button
                  className="btn btn-ghost"
                  disabled={isSaving}
                  onClick={onClose}
                  type="button"
                >
                  {t('actions.cancel', { defaultValue: 'Cancel' })}
                </button>
              </div>
            </div>
          </form>

          {/* Right column: Instructions + Test Connection */}
          <div className="hidden lg:flex lg:flex-col lg:gap-6">
            <div className="flex-1">
              <ProviderInstructions importerType={importerType} />
            </div>

            {/* Test connection section */}
            <div className="space-y-4">
              {connectionTestResult && (
                <div
                  className={`alert ${connectionTestResult === 'success' ? 'alert-success' : 'alert-error'}`}
                >
                  <span>{connectionTestMessage}</span>
                </div>
              )}
              <button
                className="btn btn-secondary w-full"
                disabled={isTestingConnection || isSaving}
                onClick={handleTestConnection}
                type="button"
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('issueImporters.testConnection.testing', {
                      defaultValue: 'Testing connection...',
                    })}
                  </>
                ) : (
                  t('issueImporters.testConnection.test', {
                    defaultValue: 'Test Connection',
                  })
                )}
              </button>
              <p className="text-base-content/60 text-xs">
                {t('issueImporters.testConnection.editModeNote', {
                  defaultValue:
                    'Note: Enter your credentials above to test the connection. Leave empty to keep existing credentials when saving.',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
