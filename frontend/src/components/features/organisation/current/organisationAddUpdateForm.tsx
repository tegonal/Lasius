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
import axios from 'axios'
import { Button } from 'components/primitives/buttons/Button'
import { Input } from 'components/primitives/inputs/Input'
import { Label } from 'components/primitives/typography/Label'
import { Alert } from 'components/ui/feedback/Alert'
import { useToast } from 'components/ui/feedback/hooks/useToast'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { ModalCloseButton } from 'components/ui/overlays/modal/ModalCloseButton'
import { ModalDescription } from 'components/ui/overlays/modal/ModalDescription'
import { ModalHeader } from 'components/ui/overlays/modal/ModalHeader'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsUserOrganisation } from 'lib/api/lasius'
import { createOrganisation, updateOrganisation } from 'lib/api/lasius/organisations/organisations'
import { getGetUserProfileKey } from 'lib/api/lasius/user/user'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSWRConfig } from 'swr'
import { z } from 'zod'

import type { TFunction } from 'i18next'

type Props = {
  item?: ModelsUserOrganisation
  mode: 'add' | 'update'
  onSave: () => void
  onCancel: () => void
}

// Schema factory function with i18n support
const createOrganisationSchema = (t: TFunction) =>
  z.object({
    organisationName: z
      .string()
      .min(
        1,
        t('validation.organisationNameRequired', { defaultValue: 'Organisation name is required' }),
      ),
  })

type FormData = z.infer<ReturnType<typeof createOrganisationSchema>>
export const OrganisationAddUpdateForm: React.FC<Props> = ({ item, onSave, onCancel, mode }) => {
  const { t } = useTranslation('common')

  // Memoize schema to prevent recreation on every render
  const schema = useMemo(() => createOrganisationSchema(t), [t])

  const hookForm = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { selectedOrganisationKey, setSelectedOrganisation } = useOrganisation()
  const { addToast } = useToast()
  const { mutate } = useSWRConfig()

  useEffect(() => {
    if (selectedOrganisationKey && mode === 'update') {
      hookForm.setValue('organisationName', selectedOrganisationKey)
    }
  }, [hookForm, mode, selectedOrganisationKey])

  const onSubmit = async () => {
    setIsSubmitting(true)
    const { organisationName } = hookForm.getValues()

    try {
      if (mode === 'add' && organisationName) {
        const newOrg = await createOrganisation({ key: organisationName })
        addToast({
          message: t('organisations.status.created', { defaultValue: 'Organisation created' }),
          type: 'SUCCESS',
        })
        if (newOrg) {
          await setSelectedOrganisation({
            id: newOrg.id,
            key: newOrg.key,
          })
        }
      } else if (item) {
        await updateOrganisation(item.organisationReference.id, {
          ...item,
          key: organisationName,
        })
        addToast({
          message: t('organisations.status.updated', { defaultValue: 'Organisation updated' }),
          type: 'SUCCESS',
        })
      }
      await mutate(getGetUserProfileKey())
      onSave()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        hookForm.setError('organisationName', {
          type: 'manual',
          message: t('organisations.errors.duplicateKey', {
            defaultValue: 'An organisation with this name already exists',
          }),
        })
      } else {
        addToast({
          message: t('organisations.errors.saveFailed', {
            defaultValue: 'Failed to save organisation',
          }),
          type: 'ERROR',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormProvider {...hookForm}>
      <div className="relative w-full">
        <form onSubmit={hookForm.handleSubmit(onSubmit)}>
          <FormBody>
            <ModalCloseButton onClose={onCancel} />

            <ModalHeader className="mb-2">
              {mode === 'add'
                ? t('organisations.actions.create', { defaultValue: 'Create organisation' })
                : t('organisations.actions.edit', { defaultValue: 'Edit organisation' })}
            </ModalHeader>

            <ModalDescription className="mb-4">
              {mode === 'add'
                ? t('organisations.description.create', {
                    defaultValue: 'Create a new organisation to collaborate with your team.',
                  })
                : t('organisations.description.edit', {
                    defaultValue: 'Update the organisation name.',
                  })}
            </ModalDescription>

            <Alert variant="info" className="mb-4">
              {t('organisations.info.uniqueNameRequired', {
                defaultValue: 'Organisation names must be unique.',
              })}
            </Alert>

            <FieldSet>
              <FormElement>
                <Label htmlFor="organisationName">
                  {t('organisations.organizationName', { defaultValue: 'Organisation name' })}
                </Label>
                <Input
                  {...hookForm.register('organisationName', {
                    onChange: () => {
                      // Clear error when user changes the field
                      if (hookForm.formState.errors.organisationName) {
                        hookForm.clearErrors('organisationName')
                      }
                    },
                  })}
                  autoComplete="off"
                />
                <FormErrorBadge error={hookForm.formState.errors.organisationName} />
              </FormElement>
            </FieldSet>
            <ButtonGroup>
              <Button type="submit" disabled={isSubmitting} className="relative z-0">
                {t('common.actions.save', { defaultValue: 'Save' })}
              </Button>
              <Button type="button" variant="secondary" onClick={onCancel}>
                {t('common.actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </ButtonGroup>
          </FormBody>
        </form>
      </div>
    </FormProvider>
  )
}
