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

import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Label } from '~/components/primitives/typography/label'
import { Alert } from '~/components/ui/feedback/alert'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalDescription } from '~/components/ui/overlays/modal/modal-description'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { mergeErrors, validateFormData } from '~/lib/conform-helpers'
import { type SchemaTranslationFn, untyped } from '~/lib/i18n-types'
import { logger } from '~/lib/logger'
import {
  useCreateOrganisation,
  useUpdateOrganisation,
} from '~/services/api/lasius-hooks/organisations/organisations'

type Props = {
  mode: 'add' | 'update'
  onCancel: () => void
  onSave: () => void
}

const createOrganisationSchema = (t: SchemaTranslationFn) =>
  z.object({
    organisationName: z
      .string({
        error: t(
          'validation.organisationNameRequired',
          'Organisation name is required',
        ),
      })
      .min(
        1,
        t(
          'validation.organisationNameRequired',
          'Organisation name is required',
        ),
      ),
  })

export const OrganisationAddUpdateForm = ({
  mode,
  onCancel,
  onSave,
}: Props) => {
  const { t } = useTranslation('organisation')
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({})

  const schema = useMemo(() => createOrganisationSchema(untyped(t)), [t])

  const {
    selectedOrganisation,
    selectedOrganisationKey,
    setSelectedOrganisation,
  } = useOrganisation()

  const duplicateErrorMsg = t(
    'errors.duplicateKey',
    'An organisation with this name already exists',
  )

  const setDuplicateError = () => {
    setServerErrors({ organisationName: [duplicateErrorMsg] })
  }

  const createApi = useCreateOrganisation({
    onError: ({ error }) => {
      logger.error('Failed to create organisation', error)
      setDuplicateError()
    },
    onSuccess: (newOrg) => {
      if (newOrg) {
        setSelectedOrganisation({ id: newOrg.id, key: newOrg.key })
      }
      onSave()
    },
  })

  const updateApi = useUpdateOrganisation({
    onError: ({ error }) => {
      logger.error('Failed to update organisation', error)
      setDuplicateError()
    },
    onSuccess: () => onSave(),
  })

  const isSubmitting = createApi.isLoading || updateApi.isLoading

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      organisationName:
        mode === 'update' ? (selectedOrganisationKey ?? '') : '',
    },
    onValidate({ formData }) {
      setServerErrors({})
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = validateFormData(e.currentTarget, schema)
    if (result.status !== 'success') return

    const { organisationName } = result.value

    if (mode === 'add' && organisationName) {
      createApi.submit({ body: { key: organisationName } })
    } else if (selectedOrganisation) {
      updateApi.submit({
        body: { key: organisationName },
        orgId: selectedOrganisation.organisationReference.id,
      })
    }
  }

  const nameErrors = mergeErrors(
    fields.organisationName.errors,
    serverErrors.organisationName,
  )

  return (
    <form {...getFormProps(form)} onSubmit={handleSubmit}>
      <FormBody>
        <ModalCloseButton onClose={onCancel} />

        <ModalHeader className="mb-2">
          {mode === 'add'
            ? t('actions.create', 'Create organisation')
            : t('actions.edit', 'Edit organisation')}
        </ModalHeader>

        <ModalDescription className="mb-4">
          {mode === 'add'
            ? t(
                'description.create',
                'Create a new organisation to collaborate with your team.',
              )
            : t('description.edit', 'Update the organisation name.')}
        </ModalDescription>

        <Alert className="mb-4" variant="info">
          {t('info.uniqueNameRequired', 'Organisation names must be unique.')}
        </Alert>

        <FieldSet>
          <FormElement>
            <Label htmlFor={fields.organisationName.id}>
              {t('organizationName', 'Organisation name')}
            </Label>
            <Input
              {...getInputProps(fields.organisationName, { type: 'text' })}
              autoComplete="off"
              data-testid="org-form-name-input"
              error={!!nameErrors?.length}
              key={fields.organisationName.key}
            />
            <FormFieldErrors errors={nameErrors} />
          </FormElement>
        </FieldSet>
        <ButtonGroup>
          <Button
            className="relative z-0"
            data-testid="org-form-submit-btn"
            disabled={isSubmitting}
            type="submit"
          >
            {t('actions.save', 'Save')}
          </Button>
          <Button
            data-testid="org-form-cancel-btn"
            onClick={onCancel}
            type="button"
            variant="secondary"
          >
            {t('actions.cancel', 'Cancel')}
          </Button>
        </ButtonGroup>
      </FormBody>
    </form>
  )
}
