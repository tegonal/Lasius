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

import { getFormProps, useForm, useInputControl } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { type z } from 'zod'

import { CheckFrequencyField } from '~/features/integrations/components/shared/check-frequency-field'
import { ConfigBaseUrlField } from '~/features/integrations/components/shared/config-base-url-field'
import { ConfigNameField } from '~/features/integrations/components/shared/config-name-field'
import { ProviderInstructions } from '~/features/integrations/components/shared/provider-instructions'
import { CreateCredentialFields } from '~/features/integrations/components/wizard/steps/create-credential-fields'
import { type WizardFormData } from '~/features/integrations/hooks/use-wizard-state'
import {
  allFieldsConstraintSchema,
  createConfigSchema,
} from '~/features/integrations/lib/config-schemas'
import { getImporterTypeLabel } from '~/features/integrations/lib/importer-type-labels'
import { untyped } from '~/lib/i18n-types'
import { type ImporterType } from '~/lib/utils/tag-helpers'

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

  const [form, fields] = useForm<
    z.input<typeof allFieldsConstraintSchema>,
    z.output<typeof allFieldsConstraintSchema>
  >({
    constraint: getZodConstraint(allFieldsConstraintSchema),
    defaultValue: {
      ...formData,
      checkFrequency: String(formData.checkFrequency),
    },
    onSubmit(event, { submission }) {
      event.preventDefault()
      if (submission?.status !== 'success') return
      onSubmit({ ...formData, ...submission.value })
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
        <form {...getFormProps(form)} className="space-y-4" ref={formRef}>
          <ConfigNameField field={fields.name} importerType={importerType} />
          <ConfigBaseUrlField
            control={baseUrlControl}
            field={fields.baseUrl}
            importerType={importerType}
          />

          <CreateCredentialFields
            accessTokenControl={accessTokenControl}
            baseUrl={baseUrlControl.value ?? ''}
            fields={fields}
            importerType={importerType}
            selectedOrgId={selectedOrgId}
          />

          <CheckFrequencyField
            control={checkFrequencyControl}
            fallbackMs={formData.checkFrequency}
            field={fields.checkFrequency}
          />
        </form>

        {/* Right column: Provider instructions */}
        <div className="hidden md:block">
          <ProviderInstructions importerType={importerType} />
        </div>
      </div>
    </div>
  )
}
