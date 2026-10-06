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

import { type FieldMetadata } from '@conform-to/react'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/primitives/inputs/input'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { type InputControl } from '~/features/integrations/components/modals/config-fields/jira-credential-fields'
import { getConfigBaseUrlPlaceholder } from '~/features/integrations/lib/config-placeholders'
import { untyped } from '~/lib/i18n-types'
import { type ImporterType } from '~/lib/utils/tag-helpers'

type ConfigBaseUrlFieldProperties = {
  control: InputControl
  field: FieldMetadata<string>
  importerType: ImporterType
}

// The parent owns the control, because other fields read the current base URL.
export const ConfigBaseUrlField = ({
  control,
  field,
  importerType,
}: ConfigBaseUrlFieldProperties) => {
  const { t } = useTranslation('integrations')

  return (
    <fieldset className="fieldset">
      <label className="label" htmlFor={field.id}>
        {t('issueImporters.fields.baseUrl', { defaultValue: 'Base URL' })}
      </label>
      <input name={field.name} type="hidden" value={control.value ?? ''} />
      <Input
        aria-invalid={field.errors ? true : undefined}
        id={field.id}
        key={field.key}
        onBlur={() => control.blur()}
        onChange={(event) => control.change(event.target.value)}
        onFocus={() => control.focus()}
        placeholder={getConfigBaseUrlPlaceholder(importerType, untyped(t))}
        type="text"
        value={control.value ?? ''}
      />
      <FormFieldErrors errors={field.errors} />
    </fieldset>
  )
}
