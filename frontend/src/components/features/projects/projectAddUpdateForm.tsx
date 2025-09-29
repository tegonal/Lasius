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

import { Button } from 'components/primitives/buttons/Button'
import { Input } from 'components/primitives/inputs/Input'
import { useToast } from 'components/ui/feedback/hooks/useToast'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsProject, ModelsUserProject } from 'lib/api/lasius'
import {
  createProject,
  getGetProjectListKey,
  updateProject,
} from 'lib/api/lasius/projects/projects'
import { getGetUserProfileKey } from 'lib/api/lasius/user/user'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSWRConfig } from 'swr'

type Props = {
  item?: ModelsProject | ModelsUserProject
  mode: 'add' | 'update'
  onSave: () => void
  onCancel: () => void
}

type FormValues = {
  projectKey: string
}

export const ProjectAddUpdateForm: React.FC<Props> = ({ item, onSave, onCancel, mode }) => {
  const { t } = useTranslation('common')

  const hookForm = useForm<FormValues>({
    defaultValues: {
      projectKey: '',
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [originalProjectName, setOriginalProjectName] = useState('')
  const { selectedOrganisationId } = useOrganisation()
  const { addToast } = useToast()

  const { mutate } = useSWRConfig()

  const projectId = (item && 'id' in item ? item.id : item?.projectReference.id) || ''
  const projectKey = (item && 'key' in item ? item.key : item?.projectReference.key) || ''
  const projectOrganisationId =
    (item && 'organisationReference' in item
      ? item.organisationReference.id
      : selectedOrganisationId) || selectedOrganisationId

  useEffect(() => {
    if (item) {
      hookForm.setValue('projectKey', projectKey)
      setOriginalProjectName(projectKey)
    }
  }, [hookForm, item, projectKey])

  const onSubmit = async () => {
    setIsSubmitting(true)
    const { projectKey } = hookForm.getValues()

    if (mode === 'add' && projectKey) {
      await createProject(projectOrganisationId, {
        key: projectKey,
        bookingCategories: [],
      })
    } else if (mode === 'update' && item) {
      await updateProject(projectOrganisationId, projectId, {
        ...item,
        ...(projectKey !== originalProjectName && { key: projectKey }),
      })
    }
    addToast({
      message: t('projects.status.updated', { defaultValue: 'Project updated' }),
      type: 'SUCCESS',
    })
    await mutate(getGetProjectListKey(projectOrganisationId))
    await mutate(getGetUserProfileKey())
    setIsSubmitting(false)
    onSave()
  }

  return (
    <FormProvider {...hookForm}>
      <form onSubmit={hookForm.handleSubmit(onSubmit)}>
        <FormBody>
          <FieldSet>
            <FormElement
              label={t('projects.projectName', { defaultValue: 'Project name' })}
              htmlFor="projectKey"
              required>
              <Input
                id="projectKey"
                {...hookForm.register('projectKey', { required: true })}
                aria-describedby="projectKey-error"
                autoComplete="off"
              />
              <FormErrorBadge id="projectKey-error" error={hookForm.formState.errors.projectKey} />
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
    </FormProvider>
  )
}
