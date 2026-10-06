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

import { getFormProps, getInputProps, useForm, useInputControl } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Input } from '~/components/primitives/inputs/input'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { DurationInput } from '~/components/ui/forms/input/duration-input'
import { ProviderInstructions } from '~/features/integrations/components/shared/provider-instructions'
import { CreateCredentialFields } from '~/features/integrations/components/wizard/steps/create-credential-fields'
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
  baseUrl: z.url(),
  checkFrequency: z.number(),
  consumerKey: z.string().optional(),
  name: z.string(),
  privateKey: z.string().optional(),
  resourceOwner: z.string().optional(),
  resourceOwnerType: z.string().optional(),
  workspace: z.string().optional(),
})

type Properties = {
  formData: WizardFormData
  formRef: React.RefObject<HTMLFormElement | null>
  onSubmit: (data: WizardFormData) => void
  selectedOrgId: string
}

export const ConfigFormStep = ({ formData, formRef, onSubmit, selectedOrgId }: Properties) => {
  const { t } = useTranslation('integrations')
  const importerType = formData.importerType as ImporterType

  const schema = useMemo(() => createConfigSchema(t, importerType, false), [t, importerType])

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

  const accessTokenControl = useInputControl(fields.accessToken)
  const baseUrlControl = useInputControl(fields.baseUrl)
  const checkFrequencyControl = useInputControl(fields.checkFrequency)

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = validateFormData(event.currentTarget, schema)
    if (result.status !== 'success') return

    onSubmit({ ...formData, ...result.value })
  }

  const checkFrequencyMs = Number(checkFrequencyControl.value) || formData.checkFrequency

  return (
    <div className="flex h-full flex-col">
      <h3 className="text-base font-semibold">
        {t('issueImporters.wizard.config.title', {
          defaultValue: 'Configure {{platform}}',
          platform: getImporterTypeLabel(importerType, untyped(t)),
        })}
      </h3>
      <p className="text-base-content/60 mt-1 text-sm">
        {t('issueImporters.wizard.config.description', {
          defaultValue: 'Enter your connection details to connect to {{platform}}.',
          platform: getImporterTypeLabel(importerType, untyped(t)),
        })}
      </p>

      <div className="mt-6 grid flex-1 grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left column: Form fields */}
        <form {...getFormProps(form)} className="space-y-4" onSubmit={handleSubmit} ref={formRef}>
          {/* Name */}
          <fieldset className="fieldset">
            <label className="label" htmlFor={fields.name.id}>
              {t('issueImporters.fields.name', {
                defaultValue: 'Configuration Name',
              })}
            </label>
            <Input
              {...getInputProps(fields.name, { type: 'text' })}
              key={fields.name.key}
              placeholder={t(`issueImporters.fields.namePlaceholder.${importerType}`, {
                defaultValue: `e.g., Company ${getImporterTypeLabel(importerType, untyped(t))}`,
              })}
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
            <input name={fields.baseUrl.name} type="hidden" value={baseUrlControl.value ?? ''} />
            <Input
              id={fields.baseUrl.id}
              key={fields.baseUrl.key}
              onBlur={() => baseUrlControl.blur()}
              onChange={(event) => baseUrlControl.change(event.target.value)}
              onFocus={() => baseUrlControl.focus()}
              placeholder={t(`issueImporters.fields.baseUrlPlaceholder.${importerType}`, {
                defaultValue: 'https://...',
              })}
              type="text"
              value={baseUrlControl.value ?? ''}
            />
            <FormFieldErrors errors={fields.baseUrl.errors} />
          </fieldset>

          <CreateCredentialFields
            accessTokenControl={accessTokenControl}
            baseUrl={baseUrlControl.value ?? ''}
            fields={fields}
            importerType={importerType}
            selectedOrgId={selectedOrgId}
          />

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
              value={checkFrequencyControl.value ?? String(formData.checkFrequency)}
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

        {/* Right column: Provider instructions */}
        <div className="hidden md:block">
          <ProviderInstructions importerType={importerType} />
        </div>
      </div>
    </div>
  )
}
