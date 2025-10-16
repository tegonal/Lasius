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
import {
  getCredentialFieldsForPlatform,
  getDefaultFormValues,
} from 'components/features/issue-importers/lib/credentialConfig'
import { useConfigSubmit } from 'components/features/issue-importers/lib/useConfigSubmit'
import { useConnectionTest } from 'components/features/issue-importers/lib/useConnectionTest'
import { useGithubResourceOwners } from 'components/features/issue-importers/lib/useGithubResourceOwners'
import { ProviderInstructions } from 'components/features/issue-importers/shared/ProviderInstructions'
import { Button } from 'components/primitives/buttons/Button'
import { Divider } from 'components/primitives/divider/Divider'
import { Input } from 'components/primitives/inputs/Input'
import { Label } from 'components/primitives/typography/Label'
import { Loading } from 'components/ui/data-display/fetchState/loading'
import { Alert } from 'components/ui/feedback/Alert'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FormElement } from 'components/ui/forms/FormElement'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { DurationInput } from 'components/ui/forms/input/DurationInput'
import { Select } from 'components/ui/forms/input/Select'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { ModalCloseButton } from 'components/ui/overlays/modal/ModalCloseButton'
import { ModalDescription } from 'components/ui/overlays/modal/ModalDescription'
import { ModalHeader } from 'components/ui/overlays/modal/ModalHeader'
import { useGetConfig } from 'lib/api/lasius/issue-importers/issue-importers'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type { ModelsIssueImporterConfigResponse } from 'lib/api/lasius'

type Props = {
  open: boolean
  onClose: () => void
  importerType: ImporterType
  config?: ModelsIssueImporterConfigResponse
  orgId: string
}

export const GenericConfigModal: React.FC<Props> = ({
  open,
  onClose,
  importerType,
  config,
  orgId,
}) => {
  const { t } = useTranslation('integrations')
  const isEdit = !!config

  // Fetch complete config by ID when editing
  const { data: fetchedConfig, isLoading: isFetchingConfig } = useGetConfig(
    orgId,
    config?.id || '',
    {
      swr: {
        enabled: isEdit && !!config?.id && open,
      },
    },
  )

  // Use fetched config if available, otherwise fallback to prop
  const activeConfig = fetchedConfig || config

  // Memoize schema to prevent recreation on every render
  const schema = useMemo(
    () => createConfigSchema(t, importerType, isEdit),
    [t, importerType, isEdit],
  )

  // Get credential fields for this platform
  const credentialFields = useMemo(
    () => getCredentialFieldsForPlatform(importerType),
    [importerType],
  )

  // Form state
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: getDefaultFormValues(importerType),
  })

  const watchCheckFrequency = watch('checkFrequency')
  const watchAccessToken = watch('accessToken')
  const watchBaseUrl = watch('baseUrl')

  // Connection test hook
  const {
    isTestingConnection,
    connectionTestResult,
    connectionTestMessage,
    handleTestConnection,
    resetTestState,
  } = useConnectionTest(importerType, orgId, activeConfig?.id)

  // GitHub resource owners hook - fetches when token and URL are present
  const { resourceOwners, isLoading: isLoadingResourceOwners } = useGithubResourceOwners(
    importerType === 'github' ? orgId : '',
    importerType === 'github' ? watchAccessToken : undefined,
    importerType === 'github' ? watchBaseUrl : undefined,
  )

  // Config submit hook
  const { onSubmit, isSaving } = useConfigSubmit(importerType, orgId, isEdit, activeConfig, onClose)

  // Reset form when config changes
  useEffect(() => {
    if (activeConfig) {
      const defaults = getDefaultFormValues(importerType)
      const resetData = {
        name: activeConfig.name,
        baseUrl: String(activeConfig.baseUrl),
        ...Object.keys(defaults).reduce(
          (acc, key) => {
            if (
              ![
                'name',
                'baseUrl',
                'checkFrequency',
                'resourceOwner',
                'resourceOwnerType',
                'workspace',
              ].includes(key)
            ) {
              acc[key] = '' // Empty in edit mode - backend doesn't return credentials
            }
            return acc
          },
          {} as Record<string, string>,
        ),
        checkFrequency: activeConfig.checkFrequency,
        resourceOwner: (activeConfig as any).resourceOwner || '',
        resourceOwnerType: (activeConfig as any).resourceOwnerType || null,
        workspace: (activeConfig as any).workspace || '',
      }
      reset(resetData)
    } else {
      reset(getDefaultFormValues(importerType))
    }
    // Reset connection test state when modal opens/config changes
    resetTestState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConfig?.id, importerType, fetchedConfig])

  // Clean up form and test state when modal closes
  useEffect(() => {
    if (!open) {
      reset(getDefaultFormValues(importerType))
      resetTestState()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleConnectionTest = () => {
    const formData = getValues()
    handleTestConnection(formData)
  }

  // Translation strings
  const nameLabel = t('issueImporters.fields.name', { defaultValue: 'Configuration Name' })

  let namePlaceholder: string
  switch (importerType) {
    case 'github':
      namePlaceholder = t('issueImporters.fields.namePlaceholder.github', {
        defaultValue: 'e.g., Company GitHub',
      })
      break
    case 'gitlab':
      namePlaceholder = t('issueImporters.fields.namePlaceholder.gitlab', {
        defaultValue: 'e.g., Company GitLab',
      })
      break
    case 'jira':
      namePlaceholder = t('issueImporters.fields.namePlaceholder.jira', {
        defaultValue: 'e.g., Company Jira',
      })
      break
    case 'plane':
      namePlaceholder = t('issueImporters.fields.namePlaceholder.plane', {
        defaultValue: 'e.g., Company Plane',
      })
      break
  }

  const baseUrlLabel = t('issueImporters.fields.baseUrl', { defaultValue: 'Base URL' })

  let baseUrlPlaceholder: string
  switch (importerType) {
    case 'github':
      baseUrlPlaceholder = t('issueImporters.fields.baseUrlPlaceholder.github', {
        defaultValue: 'https://api.github.com',
      })
      break
    case 'gitlab':
      baseUrlPlaceholder = t('issueImporters.fields.baseUrlPlaceholder.gitlab', {
        defaultValue: 'https://gitlab.com',
      })
      break
    case 'jira':
      baseUrlPlaceholder = t('issueImporters.fields.baseUrlPlaceholder.jira', {
        defaultValue: 'https://your-company.atlassian.net',
      })
      break
    case 'plane':
      baseUrlPlaceholder = t('issueImporters.fields.baseUrlPlaceholder.plane', {
        defaultValue: 'https://app.plane.so',
      })
      break
  }

  const checkIntervalLabel = t('issueImporters.checkInterval', { defaultValue: 'Check Interval' })
  const checkIntervalHelp = t('issueImporters.checkIntervalHelp', {
    defaultValue: 'How often to check for new issues',
  })
  const testConnectionTesting = t('issueImporters.testConnection.testing', {
    defaultValue: 'Testing connection...',
  })
  const testConnectionTest = t('issueImporters.testConnection.test', {
    defaultValue: 'Test Connection',
  })
  const testConnectionEditNote = t('issueImporters.testConnection.editModeNote', {
    defaultValue:
      'Note: Enter your credentials above to test the connection. Leave empty to keep existing credentials when saving.',
  })
  const actionSaving = t('actions.saving', { defaultValue: 'Saving...' })
  const actionUpdate = t('issueImporters.actions.update', { defaultValue: 'Update' })
  const actionCreate = t('issueImporters.actions.create', { defaultValue: 'Create' })
  const actionCancel = t('actions.cancel', { defaultValue: 'Cancel' })

  // Show loading state while fetching config in edit mode
  if (isEdit && isFetchingConfig) {
    return (
      <Modal open={open} onClose={onClose} autoSize>
        <div className="flex items-center justify-center p-8">
          <Loading />
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} autoSize>
      <div className="max-w-[1000px]">
        <ModalCloseButton onClose={onClose} />

        <ModalHeader helpKey="modal-importer-config" className="mb-2">
          {isEdit
            ? t('issueImporters.titles.edit', {
                defaultValue: 'Edit Integration',
              })
            : t('issueImporters.titles.create', {
                defaultValue: 'Create Integration',
              })}
        </ModalHeader>

        <ModalDescription className="mb-6">
          {isEdit
            ? t('issueImporters.descriptions.edit', {
                defaultValue: 'Update the configuration for this issue importer integration.',
              })
            : t('issueImporters.descriptions.create', {
                defaultValue:
                  'Configure a new issue importer integration to sync issues from your project management tool.',
              })}
        </ModalDescription>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left column: Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name field */}
            <FormElement>
              <Label htmlFor="name">{nameLabel}</Label>
              <Input {...register('name')} id="name" placeholder={namePlaceholder} autoFocus />
              {errors.name && <FormErrorBadge error={errors.name} />}
            </FormElement>

            {/* Base URL field */}
            <FormElement>
              <Label htmlFor="baseUrl">{baseUrlLabel}</Label>
              <Input {...register('baseUrl')} id="baseUrl" placeholder={baseUrlPlaceholder} />
              {errors.baseUrl && <FormErrorBadge error={errors.baseUrl} />}
            </FormElement>

            {/* Platform-specific credential fields */}
            {credentialFields.map((field) => {
              let fieldLabel: string
              if (isEdit) {
                switch (field.name) {
                  case 'accessToken':
                    fieldLabel = t('issueImporters.fields.accessTokenEdit', {
                      defaultValue: 'Access Token (leave empty to keep current)',
                    })
                    break
                  case 'consumerKey':
                    fieldLabel = t('issueImporters.fields.consumerKeyEdit', {
                      defaultValue: 'Consumer Key (leave empty to keep current)',
                    })
                    break
                  case 'privateKey':
                    fieldLabel = t('issueImporters.fields.privateKeyEdit', {
                      defaultValue: 'Private Key (leave empty to keep current)',
                    })
                    break
                  case 'apiKey':
                    fieldLabel = t('issueImporters.fields.apiKeyEdit', {
                      defaultValue: 'API Key (leave empty to keep current)',
                    })
                    break
                }
              } else {
                switch (field.name) {
                  case 'accessToken':
                    fieldLabel = t('issueImporters.fields.accessToken', {
                      defaultValue: 'Access Token',
                    })
                    break
                  case 'consumerKey':
                    fieldLabel = t('issueImporters.fields.consumerKey', {
                      defaultValue: 'OAuth Consumer Key',
                    })
                    break
                  case 'privateKey':
                    fieldLabel = t('issueImporters.fields.privateKey', {
                      defaultValue: 'OAuth Private Key',
                    })
                    break
                  case 'apiKey':
                    fieldLabel = t('issueImporters.fields.apiKey', {
                      defaultValue: 'API Key',
                    })
                    break
                }
              }

              const registration = register(field.name)
              return (
                <FormElement key={field.name}>
                  <Label htmlFor={field.name}>{fieldLabel}</Label>
                  <Input
                    {...registration}
                    id={field.name}
                    type={field.type}
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder={field.placeholder}
                    onChange={(e) => {
                      registration.onChange(e) // Call React Hook Form's onChange
                      resetTestState()
                    }}
                  />
                  {errors[field.name] && <FormErrorBadge error={errors[field.name]} />}
                </FormElement>
              )
            })}

            {/* GitHub resource owner dropdown */}
            {importerType === 'github' &&
              (() => {
                const resourceOwnerLabel = t('issueImporters.fields.resourceOwner', {
                  defaultValue: 'Resource Owner',
                })
                const resourceOwnerPlaceholder = isLoadingResourceOwners
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
                const resourceOwnerHelp = t('issueImporters.fields.resourceOwnerHelp', {
                  defaultValue:
                    'Select the GitHub user or organization that owns the repositories you want to access.',
                })

                return (
                  <>
                    <FormElement>
                      <Label htmlFor="resourceOwner">{resourceOwnerLabel}</Label>
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
                              const selectedOwner = resourceOwners.find(
                                (owner) => owner.id === value,
                              )
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
                            placeholder={resourceOwnerPlaceholder}
                            disabled={resourceOwners.length === 0 || isLoadingResourceOwners}
                          />
                        )}
                      />
                      {errors.resourceOwner && <FormErrorBadge error={errors.resourceOwner} />}
                      <p className="text-base-content/60 mt-1 text-xs">{resourceOwnerHelp}</p>
                    </FormElement>
                    {/* Hidden field for resourceOwnerType - set via setValue */}
                    <input type="hidden" {...register('resourceOwnerType')} />
                  </>
                )
              })()}

            {/* Plane workspace field */}
            {importerType === 'plane' && (
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
                  onChange={(e) => {
                    register('workspace').onChange(e)
                    resetTestState()
                  }}
                />
                {errors.workspace && <FormErrorBadge error={errors.workspace} />}
                <p className="text-base-content/60 mt-1 text-xs">
                  {t('issueImporters.fields.workspaceHelp', {
                    defaultValue:
                      'The workspace slug from your Plane URL (e.g., "my-company" from https://app.plane.so/my-company)',
                  })}
                </p>
              </FormElement>
            )}

            {/* Check frequency field */}
            <FormElement>
              <div className="flex flex-col gap-2">
                <Label htmlFor="checkFrequency">{checkIntervalLabel}</Label>
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
              <p className="text-base-content/60 mt-1 text-xs">{checkIntervalHelp}</p>
            </FormElement>

            <Divider className="my-6" />

            {/* Action buttons */}
            <ButtonGroup>
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? actionSaving : isEdit ? actionUpdate : actionCreate}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
                {actionCancel}
              </Button>
            </ButtonGroup>
          </form>

          {/* Right column: Platform-specific instructions */}
          <div className="hidden lg:flex lg:flex-col lg:gap-6">
            {/* Provider instructions - flex-1 makes it take remaining space */}
            <div className="flex-1">
              <ProviderInstructions importerType={importerType} />
            </div>

            {/* Test connection section (only in edit mode) - positioned at bottom */}
            {isEdit && (
              <div className="space-y-4">
                {connectionTestResult && (
                  <Alert variant={connectionTestResult === 'success' ? 'success' : 'error'}>
                    {connectionTestMessage}
                  </Alert>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleConnectionTest}
                  disabled={isTestingConnection || isSaving}
                  className="w-full">
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {testConnectionTesting}
                    </>
                  ) : (
                    testConnectionTest
                  )}
                </Button>
                <p className="text-base-content/60 text-xs">{testConnectionEditNote}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
