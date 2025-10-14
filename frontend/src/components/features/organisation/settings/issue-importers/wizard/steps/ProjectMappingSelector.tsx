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
import { Text } from 'components/primitives/typography/Text'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FormElement } from 'components/ui/forms/FormElement'
import { InputSelectAutocomplete } from 'components/ui/forms/input/InputSelectAutocomplete'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { ModalCloseButton } from 'components/ui/overlays/modal/ModalCloseButton'
import { ModalDescription } from 'components/ui/overlays/modal/ModalDescription'
import { ModalHeader } from 'components/ui/overlays/modal/ModalHeader'
import { FolderOpen } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { getDefaultTagConfiguration } from '../../shared/tagConfigDefaults'
import { TagConfigurationForm } from '../../shared/TagConfigurationForm'

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type { SelectAutocompleteSuggestionType } from 'components/ui/forms/input/InputSelectAutocomplete'
import type {
  ModelsExternalProject,
  ModelsGithubTagConfiguration,
  ModelsGitlabTagConfiguration,
  ModelsPlaneTagConfiguration,
} from 'lib/api/lasius'

type TagConfiguration =
  | ModelsGithubTagConfiguration
  | ModelsGitlabTagConfiguration
  | ModelsPlaneTagConfiguration

type FormValues = {
  projectId: string
  tagConfig?: TagConfiguration
}

type Props = {
  importerType: ImporterType
  externalProject: ModelsExternalProject
  lasiusProjects: SelectAutocompleteSuggestionType[]
  selectedProjectId?: string
  existingTagConfig?:
    | ModelsGithubTagConfiguration
    | ModelsGitlabTagConfiguration
    | ModelsPlaneTagConfiguration
  onSelect: (projectId: string | null, tagConfig: TagConfiguration | undefined) => void
  onCancel: () => void
}

export const ProjectMappingSelector: React.FC<Props> = ({
  importerType,
  externalProject,
  lasiusProjects,
  selectedProjectId,
  existingTagConfig,
  onSelect,
  onCancel,
}) => {
  const { t } = useTranslation('integrations')

  // Initialize form with selected project and tag config
  const defaultTagConfig = useMemo(
    () => existingTagConfig || getDefaultTagConfiguration(importerType),
    [existingTagConfig, importerType],
  )

  const hookForm = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      projectId: selectedProjectId || '',
      tagConfig: defaultTagConfig,
    },
  })

  const watchedProjectId = hookForm.watch('projectId')
  const watchedTagConfig = hookForm.watch('tagConfig')

  // Find the selected project for display
  const selectedItem = useMemo(
    () => lasiusProjects.find((p) => p.id === watchedProjectId) || null,
    [lasiusProjects, watchedProjectId],
  )

  const handleSubmit = (data: FormValues) => {
    if (data.projectId) {
      onSelect(data.projectId, data.tagConfig)
    }
  }

  return (
    <FormProvider {...hookForm}>
      <div className="space-y-4">
        <ModalCloseButton onClose={onCancel} />

        <ModalHeader className="mb-2">
          {selectedProjectId
            ? t('issueImporters.wizard.projects.editMapping', {
                defaultValue: 'Edit Project Mapping',
              })
            : t('issueImporters.wizard.projects.createMapping', {
                defaultValue: 'Create Project Mapping',
              })}
        </ModalHeader>

        <ModalDescription className="mb-4">
          {t('issueImporters.wizard.projects.mappingDescription', {
            defaultValue:
              'Link this external project to a Lasius project to automatically sync issues as time tracking tags.',
          })}
        </ModalDescription>

        <form onSubmit={hookForm.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="bg-base-200 flex items-center gap-3 rounded-lg p-4">
            <LucideIcon
              icon={FolderOpen}
              size={20}
              className="text-base-content/60 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{externalProject.name}</p>
              <p className="text-base-content/50 truncate text-xs">{externalProject.id}</p>
            </div>
          </div>

          <Text variant="infoText">
            {t('issueImporters.wizard.projects.selectMappingDescription', {
              defaultValue:
                'Choose which Lasius project should be linked to this external project.',
            })}
          </Text>

          <FormElement
            label={t('projects.label', { defaultValue: 'Project' })}
            htmlFor="projectId"
            required>
            <InputSelectAutocomplete
              id="projectId"
              name="projectId"
              required
              suggestions={lasiusProjects}
              selectedItem={selectedItem}
            />
          </FormElement>

          {watchedProjectId && watchedTagConfig && importerType !== 'jira' && (
            <TagConfigurationForm
              importerType={importerType}
              value={watchedTagConfig}
              onChange={(newConfig) => hookForm.setValue('tagConfig', newConfig)}
            />
          )}

          <ButtonGroup>
            <Button type="submit" variant="primary" disabled={!watchedProjectId}>
              {t('actions.confirm', { defaultValue: 'Confirm' })}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </ButtonGroup>
        </form>
      </div>
    </FormProvider>
  )
}
