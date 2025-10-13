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
import { ModelsProject, ModelsUserProject } from 'lib/api/lasius'
import { createProject, updateProject } from 'lib/api/lasius/projects/projects'
import { getGetUserProfileKey } from 'lib/api/lasius/user/user'
import { useTranslation } from 'next-i18next'
import React, { useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSWRConfig } from 'swr'
import { z } from 'zod'

import type { TFunction } from 'i18next'

type Props = {
  item?: ModelsProject | ModelsUserProject
  mode: 'add' | 'update'
  onSave: () => void
  onCancel: () => void
}

// Schema factory function with i18n support
const createProjectSchema = (t: TFunction) =>
  z.object({
    projectKey: z
      .string()
      .min(1, t('validation.projectKeyRequired', { defaultValue: 'Project name is required' })),
  })

type FormData = z.infer<ReturnType<typeof createProjectSchema>>

export const ProjectAddUpdateForm: React.FC<Props> = ({ mode, item, onCancel, onSave }) => {
  const { t } = useTranslation('common')
  const { addToast } = useToast()
  const { selectedOrganisationId } = useOrganisation()
  const { mutate } = useSWRConfig()

  // Memoize schema to prevent recreation on every render
  const schema = useMemo(() => createProjectSchema(t), [t])

  // Get the project key from either ModelsProject or ModelsUserProject
  const getProjectKey = (projectItem?: ModelsProject | ModelsUserProject): string => {
    if (!projectItem) return ''
    if ('projectReference' in projectItem) {
      return projectItem.projectReference.key
    }
    return projectItem.key
  }

  const hookForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectKey: getProjectKey(item),
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async () => {
    setIsSubmitting(true)
    const { projectKey } = hookForm.getValues()

    try {
      if (mode === 'add') {
        await createProject(selectedOrganisationId, {
          key: projectKey,
          bookingCategories: [],
        })
        addToast({
          message: t('projects.status.created', { defaultValue: 'Project created' }),
          type: 'SUCCESS',
        })
      } else if (item) {
        const itemId = 'projectReference' in item ? item.projectReference.id : item.id
        await updateProject(selectedOrganisationId, itemId, {
          key: projectKey,
        })
        addToast({
          message: t('projects.status.updated', { defaultValue: 'Project updated' }),
          type: 'SUCCESS',
        })
      }

      await mutate(getGetUserProfileKey())
      onSave()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        hookForm.setError('projectKey', {
          type: 'manual',
          message: t('projects.errors.duplicateKey', {
            defaultValue: 'A project with this name already exists',
          }),
        })
      } else {
        addToast({
          message: t('projects.errors.saveFailed', {
            defaultValue: 'Failed to save project',
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
      <div className="flex flex-col">
        <ModalCloseButton onClose={onCancel} />

        <ModalHeader>
          {mode === 'add'
            ? t('projects.actions.add', { defaultValue: 'Add Project' })
            : t('projects.actions.edit', { defaultValue: 'Edit project' })}
        </ModalHeader>

        <ModalDescription className="mb-4">
          {mode === 'add'
            ? t('projects.description.add', {
                defaultValue: 'Create a new project to organize your time tracking.',
              })
            : t('projects.description.edit', {
                defaultValue: 'Update the project details.',
              })}
        </ModalDescription>

        <form onSubmit={hookForm.handleSubmit(onSubmit)}>
          <FormBody>
            <Alert variant="info" className="mb-4">
              {t('projects.info.uniqueNameRequired', {
                defaultValue: 'Project names must be unique within your organisation.',
              })}
            </Alert>
            <FieldSet>
              <FormElement
                label={t('projects.projectName', { defaultValue: 'Project name' })}
                htmlFor="projectKey"
                required>
                <Input
                  id="projectKey"
                  {...hookForm.register('projectKey', {
                    onChange: () => {
                      // Clear error when user changes the field
                      if (hookForm.formState.errors.projectKey) {
                        hookForm.clearErrors('projectKey')
                      }
                    },
                  })}
                  aria-describedby="projectKey-error"
                  autoComplete="off"
                />
                <FormErrorBadge
                  id="projectKey-error"
                  error={hookForm.formState.errors.projectKey}
                />
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
