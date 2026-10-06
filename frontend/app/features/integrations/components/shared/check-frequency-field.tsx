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

import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { DurationInput } from '~/components/ui/forms/input/duration-input'
import { type InputControl } from '~/features/integrations/components/modals/config-fields/jira-credential-fields'

type CheckFrequencyFieldProperties = {
  control: InputControl
  fallbackMs: number
  field: FieldMetadata<number>
}

export const CheckFrequencyField = ({
  control,
  fallbackMs,
  field,
}: CheckFrequencyFieldProperties) => {
  const { t } = useTranslation('integrations')
  const valueMs = Number(control.value) || fallbackMs

  return (
    <fieldset className="fieldset">
      <label className="label" htmlFor={field.id}>
        {t('issueImporters.checkInterval', { defaultValue: 'Check Interval' })}
      </label>
      <input name={field.name} type="hidden" value={control.value ?? String(fallbackMs)} />
      <div>
        <DurationInput
          error={!!field.errors?.length}
          id={field.id}
          onChange={(ms) => control.change(String(ms))}
          value={valueMs}
        />
      </div>
      <FormFieldErrors errors={field.errors} />
      <p className="text-base-content/60 mt-1 text-xs">
        {t('issueImporters.checkIntervalHelp', {
          defaultValue: 'How often to check for new issues',
        })}
      </p>
    </fieldset>
  )
}
