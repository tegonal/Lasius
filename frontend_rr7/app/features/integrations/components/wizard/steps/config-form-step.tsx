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
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Input } from '~/components/primitives/inputs/input'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { DurationInput } from '~/components/ui/forms/input/duration-input'
import { ProviderInstructions } from '~/features/integrations/components/shared/provider-instructions'
import { useGithubResourceOwners } from '~/features/integrations/hooks/use-github-resource-owners'
import { type WizardFormData } from '~/features/integrations/hooks/use-wizard-state'
import { createConfigSchema } from '~/features/integrations/lib/config-schemas'
import { getImporterTypeLabel } from '~/features/integrations/lib/importer-type-labels'
import { validateFormData } from '~/lib/conform-helpers'
import { untyped } from '~/lib/i18n-types'
import { type ImporterType } from '~/lib/utils/tag-helpers'

/**
 * Superset schema containing all possible fields across all importer types.
 * Used only for Conform type inference (getZodConstraint) — actual validation
 * uses the platform-specific schema from createConfigSchema.
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
  formData: WizardFormData
  formRef: React.RefObject<HTMLFormElement | null>
  onSubmit: (data: WizardFormData) => void
  selectedOrgId: string
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

  const [form, fields] = useForm({
    constraint: getZodConstraint(allFieldsConstraintSchema),
    defaultValue: {
      ...formData,
      checkFrequency: String(formData.checkFrequency),
    },
    onValidate({ formData: fd }) {
      // Cast to superset type for field inference; actual validation uses platform-specific schema
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

  const { isLoadingResourceOwners, resourceOwners } = useGithubResourceOwners({
    accessToken: accessTokenControl.value ?? '',
    baseUrl: formData.baseUrl ?? '',
    importerType,
    orgId: selectedOrgId,
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = validateFormData(e.currentTarget, schema)
    if (result.status !== 'success') return

    onSubmit({ ...formData, ...result.value } as unknown as WizardFormData)
  }

  const checkFrequencyMs =
    Number(checkFrequencyControl.value) || formData.checkFrequency

  return (
    <div className="flex h-full flex-col">
      <h3 className="text-base font-semibold">
        {t('issueImporters.wizard.config.title', {
          defaultValue: `Configure ${getImporterTypeLabel(importerType, untyped(t))}`,
        })}
      </h3>
      <p className="text-base-content/60 mt-1 text-sm">
        {t('issueImporters.wizard.config.description', {
          defaultValue: `Enter your connection details to connect to ${getImporterTypeLabel(importerType, untyped(t))}.`,
        })}
      </p>

      <div className="mt-6 grid flex-1 grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left column: Form fields */}
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
                {t('issueImporters.fields.accessToken', {
                  defaultValue: 'Access Token',
                })}
              </label>
              <Input
                {...getInputProps(fields.accessToken, { type: 'password' })}
                autoComplete="off"
                data-1p-ignore
                data-form-type="other"
                data-lpignore="true"
                key={fields.accessToken.key}
                placeholder={
                  importerType === 'github'
                    ? 'github_pat_xxxxxxxxxxxxx'
                    : 'glpat-xxxxxxxxxxxxx'
                }
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
                      : resourceOwners.length === 0 && !accessTokenControl.value
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
                  {t('issueImporters.fields.privateKey', {
                    defaultValue: 'OAuth Private Key',
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
                  placeholder="-----BEGIN RSA PRIVATE KEY-----"
                  rows={4}
                />
                <FormFieldErrors errors={fields.privateKey.errors} />
              </fieldset>

              <fieldset className="fieldset">
                <label className="label" htmlFor={fields.accessToken.id}>
                  {t('issueImporters.fields.oauthAccessToken', {
                    defaultValue: 'OAuth Access Token',
                  })}
                </label>
                <Input
                  {...getInputProps(fields.accessToken, { type: 'password' })}
                  autoComplete="off"
                  data-1p-ignore
                  data-form-type="other"
                  data-lpignore="true"
                  key={fields.accessToken.key}
                  placeholder="your-oauth-access-token"
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
                  {t('issueImporters.fields.apiKey', {
                    defaultValue: 'API Key',
                  })}
                </label>
                <Input
                  {...getInputProps(fields.apiKey, { type: 'password' })}
                  autoComplete="off"
                  data-1p-ignore
                  data-form-type="other"
                  data-lpignore="true"
                  key={fields.apiKey.key}
                  placeholder="plane-api-key-xxxxxxxxxxxxx"
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
                  placeholder={t('issueImporters.fields.workspacePlaceholder', {
                    defaultValue: 'e.g., my-company',
                  })}
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
            <label className="label" htmlFor="checkFrequency">
              {t('issueImporters.checkInterval', {
                defaultValue: 'Check Interval',
              })}
            </label>
            <input
              name={fields.checkFrequency.name}
              type="hidden"
              value={
                checkFrequencyControl.value ?? String(formData.checkFrequency)
              }
            />
            <div>
              <DurationInput
                error={!!fields.checkFrequency.errors?.length}
                id="checkFrequency"
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
        </form>

        {/* Right column: Platform-specific instructions */}
        <div className="hidden md:block">
          <ProviderInstructions importerType={importerType} />
        </div>
      </div>
    </div>
  )
}
