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
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'
import { z } from 'zod'

import { Input } from '~/components/primitives/inputs/input'
import { useToast } from '~/components/ui/feedback/use-toast'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { DurationInput } from '~/components/ui/forms/input/duration-input'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { GithubResourceOwnerField } from '~/features/integrations/components/modals/config-fields/github-resource-owner-field'
import { JiraCredentialFields } from '~/features/integrations/components/modals/config-fields/jira-credential-fields'
import { PlaneFields } from '~/features/integrations/components/modals/config-fields/plane-fields'
import { ConnectionTestPanel } from '~/features/integrations/components/modals/connection-test-panel'
import { ProviderInstructions } from '~/features/integrations/components/shared/provider-instructions'
import { useConnectionTest } from '~/features/integrations/hooks/use-connection-test'
import { createConfigSchema } from '~/features/integrations/lib/config-schemas'
import { getImporterTypeLabel } from '~/features/integrations/lib/importer-type-labels'
import { validateFormData } from '~/lib/conform-helpers'
import { untyped } from '~/lib/i18n-types'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import { useUpdateConfig } from '~/services/api/lasius-hooks/issue-importers/issue-importers'
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

  // Connection test hook
  const {
    connectionTestMessage,
    connectionTestResult,
    handleTestConnection,
    isTestingConnection,
    resetTestState,
  } = useConnectionTest({
    config,
    formRef,
    importerType,
    open,
    selectedOrgId,
  })

  // Reset form when config changes or modal opens
  useEffect(() => {
    if (config && open) {
      form.reset()
      resetTestState()
    }
  }, [config, open, form, resetTestState])

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
              <GithubResourceOwnerField
                accessTokenValue={accessTokenControl.value ?? ''}
                baseUrl={String(config.baseUrl)}
                fields={{
                  resourceOwner: fields.resourceOwner,
                  resourceOwnerType: fields.resourceOwnerType,
                }}
                importerType={importerType}
                selectedOrgId={selectedOrgId}
              />
            )}

            {/* Jira fields */}
            {importerType === 'jira' && (
              <JiraCredentialFields
                accessTokenControl={accessTokenControl}
                fields={{
                  accessToken: fields.accessToken,
                  consumerKey: fields.consumerKey,
                  privateKey: fields.privateKey,
                }}
                resetTestState={resetTestState}
              />
            )}

            {/* Plane fields */}
            {importerType === 'plane' && (
              <PlaneFields
                fields={{
                  apiKey: fields.apiKey,
                  workspace: fields.workspace,
                }}
                resetTestState={resetTestState}
              />
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
                  String(config.checkFrequency || 300_000)
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

            <ConnectionTestPanel
              connectionTestMessage={connectionTestMessage}
              connectionTestResult={connectionTestResult}
              handleTestConnection={handleTestConnection}
              isSaving={isSaving}
              isTestingConnection={isTestingConnection}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
