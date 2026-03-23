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

import { zodResolver } from '@hookform/resolvers/zod'
import { type TFunction } from 'i18next'
import { useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
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
import { FormErrorBadge } from '~/components/ui/forms/form-error-badge'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalDescription } from '~/components/ui/overlays/modal/modal-description'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
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

const createOrganisationSchema = (t: TFunction) =>
  z.object({
    organisationName: z.string().min(
      1,
      t('validation.organisationNameRequired', {
        defaultValue: 'Organisation name is required',
      }),
    ),
  })

type FormData = z.infer<ReturnType<typeof createOrganisationSchema>>

export const OrganisationAddUpdateForm = ({
  mode,
  onCancel,
  onSave,
}: Props) => {
  const { t } = useTranslation('common')

  const schema = useMemo(() => createOrganisationSchema(t), [t])

  const hookForm = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const {
    selectedOrganisation,
    selectedOrganisationKey,
    setSelectedOrganisation,
  } = useOrganisation()

  const setDuplicateError = useCallback(() => {
    hookForm.setError('organisationName', {
      message: t('organisations.errors.duplicateKey', {
        defaultValue: 'An organisation with this name already exists',
      }),
      type: 'manual',
    })
  }, [hookForm, t])

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

  useEffect(() => {
    if (selectedOrganisationKey && mode === 'update') {
      hookForm.setValue('organisationName', selectedOrganisationKey)
    }
  }, [hookForm, mode, selectedOrganisationKey])

  const onSubmit = () => {
    const { organisationName } = hookForm.getValues()

    if (mode === 'add' && organisationName) {
      createApi.submit({
        body: { key: organisationName },
      } as Parameters<typeof createApi.submit>[0])
    } else if (selectedOrganisation) {
      updateApi.submit({
        body: { key: organisationName },
        orgId: selectedOrganisation.organisationReference.id,
      })
    }
  }

  return (
    <form onSubmit={hookForm.handleSubmit(onSubmit)}>
      <FormBody>
        <ModalCloseButton onClose={onCancel} />

        <ModalHeader className="mb-2">
          {mode === 'add'
            ? t('organisations.actions.create', {
                defaultValue: 'Create organisation',
              })
            : t('organisations.actions.edit', {
                defaultValue: 'Edit organisation',
              })}
        </ModalHeader>

        <ModalDescription className="mb-4">
          {mode === 'add'
            ? t('organisations.description.create', {
                defaultValue:
                  'Create a new organisation to collaborate with your team.',
              })
            : t('organisations.description.edit', {
                defaultValue: 'Update the organisation name.',
              })}
        </ModalDescription>

        <Alert className="mb-4" variant="info">
          {t('organisations.info.uniqueNameRequired', {
            defaultValue: 'Organisation names must be unique.',
          })}
        </Alert>

        <FieldSet>
          <FormElement>
            <Label htmlFor="organisationName">
              {t('organisations.organizationName', {
                defaultValue: 'Organisation name',
              })}
            </Label>
            <Input
              data-testid="org-form-name-input"
              {...hookForm.register('organisationName', {
                onChange: () => {
                  if (hookForm.formState.errors.organisationName) {
                    hookForm.clearErrors('organisationName')
                  }
                },
              })}
              autoComplete="off"
            />
            <FormErrorBadge
              error={hookForm.formState.errors.organisationName}
            />
          </FormElement>
        </FieldSet>
        <ButtonGroup>
          <Button
            className="relative z-0"
            data-testid="org-form-submit-btn"
            disabled={isSubmitting}
            type="submit"
          >
            {t('common.actions.save', { defaultValue: 'Save' })}
          </Button>
          <Button
            data-testid="org-form-cancel-btn"
            onClick={onCancel}
            type="button"
            variant="secondary"
          >
            {t('common.actions.cancel', {
              defaultValue: 'Cancel',
            })}
          </Button>
        </ButtonGroup>
      </FormBody>
    </form>
  )
}
