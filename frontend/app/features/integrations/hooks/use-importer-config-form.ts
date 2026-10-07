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

import { type DefaultValue, useForm, useInputControl } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { type z } from 'zod'

import { allFieldsConstraintSchema } from '~/features/integrations/lib/config-schemas'

type ConfigFormInput = z.input<typeof allFieldsConstraintSchema>
type ConfigFormOutput = z.output<typeof allFieldsConstraintSchema>

type UseImporterConfigFormOptions = {
  defaultValue: DefaultValue<ConfigFormInput>
  id?: string
  onValidSubmit: (value: ConfigFormOutput) => void
  schema: z.ZodType
}

export const useImporterConfigForm = ({
  defaultValue,
  id,
  onValidSubmit,
  schema,
}: UseImporterConfigFormOptions) => {
  const [form, fields] = useForm<ConfigFormInput, ConfigFormOutput>({
    constraint: getZodConstraint(allFieldsConstraintSchema),
    defaultValue,
    id,
    onSubmit(event, { submission }) {
      event.preventDefault()
      if (submission?.status !== 'success') return
      onValidSubmit(submission.value)
    },
    onValidate({ formData }) {
      // The platform schema validates; the superset type only gives Conform the field names.
      return parseWithZod(formData, {
        schema: schema as typeof allFieldsConstraintSchema,
      })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  const accessTokenControl = useInputControl(fields.accessToken)
  const baseUrlControl = useInputControl(fields.baseUrl)
  const checkFrequencyControl = useInputControl(fields.checkFrequency)

  return { accessTokenControl, baseUrlControl, checkFrequencyControl, fields, form }
}
