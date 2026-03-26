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

import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '~/components/primitives/buttons/button'
import { Alert } from '~/components/ui/feedback/alert'
import { useToast } from '~/components/ui/feedback/use-toast'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FormField } from '~/components/ui/forms/conform/form-field'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalDescription } from '~/components/ui/overlays/modal/modal-description'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { validateFormData } from '~/lib/conform-helpers'
import { type SchemaTranslationFn, untyped } from '~/lib/i18n-types'
import {
  useCreateProject,
  useUpdateProject,
} from '~/services/api/lasius-hooks/projects/projects'
import { type ModelsProject } from '~/services/api/lasius/modelsProject'
import { type ModelsUserProject } from '~/services/api/lasius/modelsUserProject'

type Props = {
  item?: ModelsProject | ModelsUserProject
  mode: 'add' | 'update'
  onCancel: () => void
  onSave: () => void
}

const createProjectSchema = (t: SchemaTranslationFn) =>
  z.object({
    projectKey: z
      .string({
        error: t('validation.projectKeyRequired', 'Project name is required'),
      })
      .min(1, t('validation.projectKeyRequired', 'Project name is required')),
  })

const getProjectKey = (
  projectItem?: ModelsProject | ModelsUserProject,
): string => {
  if (!projectItem) return ''
  if ('projectReference' in projectItem) {
    return projectItem.projectReference.key
  }
  return projectItem.key
}

const getProjectId = (
  projectItem?: ModelsProject | ModelsUserProject,
): string => {
  if (!projectItem) return ''
  if ('projectReference' in projectItem) {
    return projectItem.projectReference.id
  }
  return projectItem.id
}

export const ProjectAddUpdateForm = ({
  item,
  mode,
  onCancel,
  onSave,
}: Props) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { selectedOrganisationId } = useOrganisation()

  const onSuccess = () => {
    addToast({
      message:
        mode === 'add'
          ? t('projects:status.created', 'Project created')
          : t('projects:status.updated', 'Project updated'),
      type: 'SUCCESS',
    })
    onSave()
  }

  const createProjectApi = useCreateProject({ onSuccess })
  const updateProjectApi = useUpdateProject({ onSuccess })
  const activeFetcher = mode === 'add' ? createProjectApi : updateProjectApi

  const schema = useMemo(() => createProjectSchema(untyped(t)), [t])

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      projectKey: getProjectKey(item),
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = validateFormData(e.currentTarget, schema)
    if (result.status !== 'success') return

    const { projectKey } = result.value

    if (mode === 'add') {
      createProjectApi.submit({
        body: { bookingCategories: [], key: projectKey },
        orgId: selectedOrganisationId,
      })
    } else {
      updateProjectApi.submit({
        body: { key: projectKey },
        orgId: selectedOrganisationId,
        projectId: getProjectId(item),
      })
    }
  }

  return (
    <div className="flex flex-col">
      <ModalCloseButton onClose={onCancel} />

      <ModalHeader>
        {mode === 'add'
          ? t('projects:actions.add', 'Add Project')
          : t('projects:actions.edit', 'Edit project')}
      </ModalHeader>

      <ModalDescription className="mb-4">
        {mode === 'add'
          ? t(
              'projects:description.add',
              'Create a new project to organize your time tracking.',
            )
          : t('projects:description.edit', 'Update the project details.')}
      </ModalDescription>

      <form {...getFormProps(form)} onSubmit={handleSubmit}>
        <FormBody>
          <Alert className="mb-4" variant="info">
            {t(
              'projects:info.uniqueNameRequired',
              'Project names must be unique within your organisation.',
            )}
          </Alert>
          <FieldSet>
            <FormField
              autoComplete="off"
              data-testid="project-form-key-input"
              field={fields.projectKey}
              label={t('projects:projectName', 'Project name')}
              required
            />
          </FieldSet>
          <ButtonGroup>
            <Button
              className="relative z-0"
              data-testid="project-form-save-btn"
              disabled={activeFetcher.isSubmitting}
              type="submit"
            >
              {t('actions.save', 'Save')}
            </Button>
            <Button
              data-testid="project-form-close-btn"
              onClick={onCancel}
              type="button"
              variant="secondary"
            >
              {t('actions.cancel', 'Cancel')}
            </Button>
          </ButtonGroup>
        </FormBody>
      </form>
    </div>
  )
}
