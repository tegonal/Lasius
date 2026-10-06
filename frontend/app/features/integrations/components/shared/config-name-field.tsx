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

import type React from 'react'

import { type FieldMetadata, getInputProps } from '@conform-to/react'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/primitives/inputs/input'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { getConfigNamePlaceholder } from '~/features/integrations/lib/config-placeholders'
import { untyped } from '~/lib/i18n-types'
import { type ImporterType } from '~/lib/utils/tag-helpers'

type ConfigNameFieldProperties = {
  field: FieldMetadata<string>
  importerType: ImporterType
  inputRef?: React.Ref<HTMLInputElement>
}

export const ConfigNameField = ({ field, importerType, inputRef }: ConfigNameFieldProperties) => {
  const { t } = useTranslation('integrations')

  return (
    <fieldset className="fieldset">
      <label className="label" htmlFor={field.id}>
        {t('issueImporters.fields.name', { defaultValue: 'Configuration Name' })}
      </label>
      <Input
        {...getInputProps(field, { type: 'text' })}
        key={field.key}
        placeholder={getConfigNamePlaceholder(importerType, untyped(t))}
        ref={inputRef}
      />
      <FormFieldErrors errors={field.errors} />
    </fieldset>
  )
}
