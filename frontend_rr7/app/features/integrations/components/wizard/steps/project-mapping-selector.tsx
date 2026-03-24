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

import { FolderOpen } from 'lucide-react'
import { useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { Text } from '~/components/primitives/typography/text'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { InputSelectAutocomplete } from '~/components/ui/forms/input/input-select-autocomplete'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalDescription } from '~/components/ui/overlays/modal/modal-description'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import {
  type ModelsExternalProject,
  type ModelsGithubTagConfiguration,
  type ModelsGitlabTagConfiguration,
  type ModelsPlaneTagConfiguration,
} from '~/services/api/lasius'

type FormValues = {
  projectId: string
  tagConfig?: TagConfiguration
}

type Props = {
  existingTagConfig?:
    | ModelsGithubTagConfiguration
    | ModelsGitlabTagConfiguration
    | ModelsPlaneTagConfiguration
  externalProject: ModelsExternalProject
  importerType: ImporterType
  lasiusProjects: Array<{ id: string; key: string }>
  onCancel: () => void
  onSelect: (
    projectId: null | string,
    tagConfig: TagConfiguration | undefined,
  ) => void
  selectedProjectId?: string
}

type TagConfiguration =
  | ModelsGithubTagConfiguration
  | ModelsGitlabTagConfiguration
  | ModelsPlaneTagConfiguration

export const ProjectMappingSelector = ({
  existingTagConfig,
  externalProject,
  importerType: _importerType,
  lasiusProjects,
  onCancel,
  onSelect,
  selectedProjectId,
}: Props) => {
  const { t } = useTranslation('integrations')

  const hookForm = useForm<FormValues>({
    defaultValues: {
      projectId: selectedProjectId || '',
      tagConfig: existingTagConfig,
    },
    mode: 'onChange',
  })

  const watchedProjectId = hookForm.watch('projectId')
  const watchedTagConfig = hookForm.watch('tagConfig')

  // Build suggestions in the format InputSelectAutocomplete expects
  const suggestions = useMemo(
    () => lasiusProjects.map((p) => ({ id: p.id, key: p.key })),
    [lasiusProjects],
  )

  const selectedItem = useMemo(
    () => suggestions.find((p) => p.id === watchedProjectId) || null,
    [suggestions, watchedProjectId],
  )

  const handleSubmit = (data: FormValues) => {
    if (data.projectId) {
      onSelect(data.projectId, data.tagConfig)
    }
  }

  return (
    <FormProvider {...hookForm}>
      <form
        className="flex h-full flex-col"
        onSubmit={hookForm.handleSubmit(handleSubmit)}
      >
        <ModalCloseButton onClose={onCancel} />

        <div className="flex h-full flex-col">
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

          <div className="space-y-4">
            <div className="bg-base-200 flex items-center gap-3 rounded-lg p-4">
              <LucideIcon
                className="text-base-content/60 flex-shrink-0"
                icon={FolderOpen}
                size={20}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{externalProject.name}</p>
                <p className="text-base-content/50 truncate text-xs">
                  {externalProject.id}
                </p>
              </div>
            </div>

            <Text variant="infoText">
              {t('issueImporters.wizard.projects.selectMappingDescription', {
                defaultValue:
                  'Choose which Lasius project should be linked to this external project.',
              })}
            </Text>

            <FormBody>
              <FormElement
                htmlFor="projectId"
                label={t('projects.label', {
                  defaultValue: 'Project',
                })}
                required
              >
                <InputSelectAutocomplete
                  id="projectId"
                  name="projectId"
                  required
                  selectedItem={selectedItem}
                  suggestions={suggestions}
                />
              </FormElement>

              {/* Tag configuration form will be added here when TagConfigurationForm is migrated */}
              {watchedProjectId &&
                watchedTagConfig &&
                _importerType !== 'jira' && (
                  <Text className="text-base-content/50" variant="infoText">
                    {t('issueImporters.wizard.projects.tagConfigPlaceholder', {
                      defaultValue:
                        'Tag configuration options will be available after saving.',
                    })}
                  </Text>
                )}
            </FormBody>
          </div>
        </div>

        <div className="mt-6">
          <ButtonGroup>
            <Button
              disabled={!watchedProjectId}
              type="submit"
              variant="primary"
            >
              {t('actions.confirm', { defaultValue: 'Confirm' })}
            </Button>
            <Button onClick={onCancel} type="button" variant="secondary">
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </ButtonGroup>
        </div>
      </form>
    </FormProvider>
  )
}
