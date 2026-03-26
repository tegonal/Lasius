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

import {
  getFormProps,
  getInputProps,
  useForm,
  useInputControl,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'
import { z } from 'zod'

import { Input } from '~/components/primitives/inputs/input'
import { useToast } from '~/components/ui/feedback/use-toast'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { DurationInput } from '~/components/ui/forms/input/duration-input'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { ProviderInstructions } from '~/features/integrations/components/shared/provider-instructions'
import { useGithubResourceOwners } from '~/features/integrations/hooks/use-github-resource-owners'
import { createConfigSchema } from '~/features/integrations/lib/config-schemas'
import { getImporterTypeLabel } from '~/features/integrations/lib/importer-type-labels'
import { validateFormData } from '~/lib/conform-helpers'
import { untyped } from '~/lib/i18n-types'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import {
  useTestConnectivity,
  useTestExistingConfig,
  useUpdateConfig,
} from '~/services/api/lasius-hooks/issue-importers/issue-importers'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius/modelsIssueImporterConfigResponse'
import { type ModelsUpdateIssueImporterConfig } from '~/services/api/lasius/modelsUpdateIssueImporterConfig'

/**
 * Superset schema containing all possible fields across all importer types.
 * Used only for Conform type inference — actual validation uses the
 * platform-specific schema from createConfigSchema.
 */
const allFieldsConstraintSchema = z.object({
  accessToken: z.string().optional(),
  apiKey: z.string().optional(),
  baseUrl: z.string(),
  checkFrequency: z.number(),
  consumerKey: z.string().optional(),
  name: z.string(),
  privateKey: z.string().optional(),
  resourceOwner: z.string().optional(),
  resourceOwnerType: z.string().optional(),
  workspace: z.string().optional(),
})

type Props = {
  config: ModelsIssueImporterConfigResponse | null
  onClose: () => void
  open: boolean
  selectedOrgId: string
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
  const { addToast } = useToast()
  const revalidator = useRevalidator()
  const formRef = useRef<HTMLFormElement>(null)

  const [connectionTestResult, setConnectionTestResult] =
    useState<ConnectionTestResult>(null)
  const [connectionTestMessage, setConnectionTestMessage] = useState('')

  const importerType = config ? getImporterType(config) : 'gitlab'

  const schema = useMemo(
    () => createConfigSchema(t, importerType, true),
    [t, importerType],
  )

  const defaultValue = useMemo(
    () => ({
      accessToken: '',
      apiKey: '',
      baseUrl: config ? String(config.baseUrl) : '',
      checkFrequency: config ? String(config.checkFrequency) : '300000',
      consumerKey: '',
      name: config?.name ?? '',
      privateKey: '',
      resourceOwner:
        config && 'resourceOwner' in config
          ? String(config.resourceOwner ?? '')
          : '',
      resourceOwnerType:
        config && 'resourceOwnerType' in config
          ? String(config.resourceOwnerType ?? '')
          : '',
      workspace:
        config && 'workspace' in config ? String(config.workspace ?? '') : '',
    }),
    [config],
  )

  const [form, fields] = useForm({
    constraint: getZodConstraint(allFieldsConstraintSchema),
    defaultValue,
    onValidate({ formData: fd }) {
      return parseWithZod(fd, {
        schema: schema as typeof allFieldsConstraintSchema,
      })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  const checkFrequencyControl = useInputControl(fields.checkFrequency)
  const accessTokenControl = useInputControl(fields.accessToken)
  const resourceOwnerControl = useInputControl(fields.resourceOwner)
  const resourceOwnerTypeControl = useInputControl(fields.resourceOwnerType)

  // Reset form when config changes or modal opens
  useEffect(() => {
    if (config && open) {
      form.reset()
      setConnectionTestResult(null)
      setConnectionTestMessage('')
    }
  }, [config, open, form])

  // Clean up when modal closes
  useEffect(() => {
    if (!open) {
      setConnectionTestResult(null)
      setConnectionTestMessage('')
    }
  }, [open])

  const { isLoadingResourceOwners, resourceOwners } = useGithubResourceOwners({
    accessToken: accessTokenControl.value ?? '',
    baseUrl: String(config?.baseUrl ?? ''),
    importerType,
    orgId: selectedOrgId,
  })

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
    onError: () => {
      addToast({
        message: t('issueImporters.errors.updateFailed', {
          defaultValue: 'Failed to update integration',
        }),
        type: 'ERROR',
      })
    },
    onSuccess: () => {
      onClose()
      void revalidator.revalidate()
      addToast({
        message: t('issueImporters.success.configUpdated', {
          defaultValue: 'Integration updated successfully',
        }),
        type: 'SUCCESS',
      })
    },
  })

  const isSaving = updateApi.isSubmitting

  /** Read current form values from the DOM */
  const getFormValues = useCallback(() => {
    if (!formRef.current) return {} as unknown as Record<string, string>
    const fd = new FormData(formRef.current)
    return Object.fromEntries(fd.entries()) as Record<string, string>
  }, [])

  const hasNewCredentials = useCallback(() => {
    const values = getFormValues()
    switch (importerType) {
      case 'github':
      case 'gitlab': {
        return !!values.accessToken
      }
      case 'jira': {
        return (
          !!values.accessToken || !!values.consumerKey || !!values.privateKey
        )
      }
      case 'plane': {
        return !!values.apiKey
      }
    }
  }, [getFormValues, importerType])

  const handleTestConnection = useCallback(() => {
    if (!config) return

    if (hasNewCredentials()) {
      const values = getFormValues()
      testConnectivityApi.submit({
        body: {
          accessToken: values.accessToken || undefined,
          apiKey: values.apiKey || undefined,
          baseUrl: values.baseUrl,
          checkFrequency: Number(values.checkFrequency),
          consumerKey: values.consumerKey || undefined,
          importerType: importerType as unknown as never,
          name: values.name,
          privateKey: values.privateKey || undefined,
          resourceOwner: values.resourceOwner || undefined,
          resourceOwnerType: values.resourceOwnerType || undefined,
          workspace: values.workspace || undefined,
        } as unknown as never,
        orgId: selectedOrgId,
      })
    } else {
      testExistingApi.submit({
        configId: config.id,
        orgId: selectedOrgId,
      })
    }
  }, [
    config,
    getFormValues,
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!config) return

    const result = validateFormData(e.currentTarget, schema)
    if (result.status !== 'success') return

    const data = result.value as Record<string, unknown>

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

    // Always include non-credential config fields so they can be updated/cleared
    body.workspace = (data.workspace as string) || null
    body.resourceOwner = (data.resourceOwner as string) || null
    if (data.resourceOwnerType)
      body.resourceOwnerType = data.resourceOwnerType as never

    updateApi.submit({
      body,
      configId: config.id,
      orgId: selectedOrgId,
    })
  }

  const checkFrequencyMs =
    Number(checkFrequencyControl.value) || config?.checkFrequency || 300_000

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
            {...getFormProps(form)}
            className="space-y-4"
            onSubmit={handleSubmit}
            ref={formRef}
          >
            {/* Name */}
            <fieldset className="fieldset">
              <label className="label" htmlFor={fields.name.id}>
                {t('issueImporters.fields.name', {
                  defaultValue: 'Configuration Name',
                })}
              </label>
              <Input
                {...getInputProps(fields.name, { type: 'text' })}
                autoFocus
                key={fields.name.key}
                placeholder={t(
                  `issueImporters.fields.namePlaceholder.${importerType}`,
                  {
                    defaultValue: `e.g., Company ${getImporterTypeLabel(importerType, untyped(t))}`,
                  },
                )}
              />
              <FormFieldErrors errors={fields.name.errors} />
            </fieldset>

            {/* Base URL */}
            <fieldset className="fieldset">
              <label className="label" htmlFor={fields.baseUrl.id}>
                {t('issueImporters.fields.baseUrl', {
                  defaultValue: 'Base URL',
                })}
              </label>
              <Input
                {...getInputProps(fields.baseUrl, { type: 'text' })}
                key={fields.baseUrl.key}
                placeholder={t(
                  `issueImporters.fields.baseUrlPlaceholder.${importerType}`,
                  { defaultValue: 'https://...' },
                )}
              />
              <FormFieldErrors errors={fields.baseUrl.errors} />
            </fieldset>

            {/* GitHub / GitLab: Access Token */}
            {(importerType === 'github' || importerType === 'gitlab') && (
              <fieldset className="fieldset">
                <label className="label" htmlFor={fields.accessToken.id}>
                  {t('issueImporters.fields.accessTokenEdit', {
                    defaultValue: 'Access Token (leave empty to keep current)',
                  })}
                </label>
                <Input
                  {...getInputProps(fields.accessToken, { type: 'password' })}
                  autoComplete="off"
                  data-1p-ignore
                  data-form-type="other"
                  data-lpignore="true"
                  key={fields.accessToken.key}
                  onChange={(e) => {
                    accessTokenControl.change(e.target.value)
                    resetTestState()
                  }}
                  placeholder={t(
                    'issueImporters.fields.credentialPlaceholder',
                    { defaultValue: 'Enter new value to update' },
                  )}
                />
                <FormFieldErrors errors={fields.accessToken.errors} />
              </fieldset>
            )}

            {/* GitHub: Resource Owner */}
            {importerType === 'github' && (
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
                    disabled={
                      resourceOwners.length === 0 || isLoadingResourceOwners
                    }
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
                        : resourceOwners.length === 0 &&
                            !accessTokenControl.value
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
            )}

            {/* Jira fields */}
            {importerType === 'jira' && (
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
                      // Let the native input update the form value
                      e.target.dispatchEvent(
                        new Event('input', { bubbles: true }),
                      )
                    }}
                    placeholder={t(
                      'issueImporters.fields.credentialPlaceholder',
                      { defaultValue: 'Enter new value to update' },
                    )}
                    rows={4}
                  />
                  <FormFieldErrors errors={fields.privateKey.errors} />
                </fieldset>

                <fieldset className="fieldset">
                  <label className="label" htmlFor={fields.accessToken.id}>
                    {t('issueImporters.fields.accessTokenEdit', {
                      defaultValue:
                        'Access Token (leave empty to keep current)',
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
                    placeholder={t(
                      'issueImporters.fields.credentialPlaceholder',
                      { defaultValue: 'Enter new value to update' },
                    )}
                  />
                  <FormFieldErrors errors={fields.accessToken.errors} />
                </fieldset>
              </>
            )}

            {/* Plane fields */}
            {importerType === 'plane' && (
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
                    placeholder={t(
                      'issueImporters.fields.credentialPlaceholder',
                      { defaultValue: 'Enter new value to update' },
                    )}
                  />
                  <FormFieldErrors errors={fields.apiKey.errors} />
                </fieldset>

                <fieldset className="fieldset">
                  <label className="label" htmlFor={fields.workspace.id}>
                    {t('issueImporters.fields.workspace', {
                      defaultValue: 'Workspace',
                    })}
                  </label>
                  <Input
                    {...getInputProps(fields.workspace, { type: 'text' })}
                    key={fields.workspace.key}
                    onChange={() => {
                      resetTestState()
                    }}
                    placeholder={t(
                      'issueImporters.fields.workspacePlaceholder',
                      { defaultValue: 'e.g., my-company' },
                    )}
                  />
                  <FormFieldErrors errors={fields.workspace.errors} />
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
              <input
                name={fields.checkFrequency.name}
                type="hidden"
                value={
                  checkFrequencyControl.value ??
                  String(config?.checkFrequency || 300_000)
                }
              />
              <div>
                <DurationInput
                  error={!!fields.checkFrequency.errors?.length}
                  id="edit-checkFrequency"
                  onChange={(ms) => checkFrequencyControl.change(String(ms))}
                  value={checkFrequencyMs}
                />
              </div>
              <FormFieldErrors errors={fields.checkFrequency.errors} />
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
