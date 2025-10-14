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

import { ContextButtonClose } from 'components/features/contextMenu/buttons/contextButtonClose'
import { ContextButtonOpen } from 'components/features/contextMenu/buttons/contextButtonOpen'
import { ContextAnimatePresence } from 'components/features/contextMenu/contextAnimatePresence'
import { ContextBar } from 'components/features/contextMenu/contextBar'
import { ContextBarDivider } from 'components/features/contextMenu/contextBarDivider'
import { ContextBody } from 'components/features/contextMenu/contextBody'
import { ContextButtonWrapper } from 'components/features/contextMenu/contextButtonWrapper'
import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { Button } from 'components/primitives/buttons/Button'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { GenericConfirmModal } from 'components/ui/overlays/modal/GenericConfirmModal'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { AnimatePresence } from 'framer-motion'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'

import { ProjectMappingSelector } from './ProjectMappingSelector'

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

type Props = {
  importerType: ImporterType
  externalProject: ModelsExternalProject
  lasiusProjects: SelectAutocompleteSuggestionType[]
  selectedProjectId?: string
  existingTagConfig?:
    | ModelsGithubTagConfiguration
    | ModelsGitlabTagConfiguration
    | ModelsPlaneTagConfiguration
  onMappingChange: (
    externalProjectId: string,
    lasiusProjectId: string | null,
    tagConfig: TagConfiguration | undefined,
  ) => void
}

export const ProjectMappingRowContext: React.FC<Props> = ({
  importerType,
  externalProject,
  lasiusProjects,
  selectedProjectId,
  existingTagConfig,
  onMappingChange,
}) => {
  const { t } = useTranslation('integrations')
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false)
  const { handleCloseAll, currentOpenContextMenuId } = useContextMenu()

  const handleSelectorClose = () => setIsSelectorOpen(false)

  const openSelector = () => {
    setIsSelectorOpen(true)
    handleCloseAll()
  }

  const openConfirmRemove = () => {
    setIsConfirmRemoveOpen(true)
    handleCloseAll()
  }

  const handleConfirmRemove = () => {
    onMappingChange(externalProject.id, null, undefined)
    setIsConfirmRemoveOpen(false)
  }

  return (
    <>
      <ContextBody variant="compact">
        <ContextButtonOpen hash={externalProject.id} />
        <AnimatePresence>
          {currentOpenContextMenuId === externalProject.id && (
            <ContextAnimatePresence variant="compact">
              <ContextBar>
                <ContextButtonWrapper variant="compact">
                  <Button
                    variant="contextIcon"
                    title={
                      selectedProjectId
                        ? t('issueImporters.wizard.projects.changeMapping', {
                            defaultValue: 'Change mapping',
                          })
                        : t('issueImporters.wizard.projects.addMapping', {
                            defaultValue: 'Add mapping',
                          })
                    }
                    aria-label={
                      selectedProjectId
                        ? t('issueImporters.wizard.projects.changeMapping', {
                            defaultValue: 'Change mapping',
                          })
                        : t('issueImporters.wizard.projects.addMapping', {
                            defaultValue: 'Add mapping',
                          })
                    }
                    onClick={openSelector}
                    fullWidth={false}
                    shape="circle">
                    <LucideIcon icon={selectedProjectId ? Pencil : Plus} size={24} />
                  </Button>
                </ContextButtonWrapper>
                {selectedProjectId && (
                  <ContextButtonWrapper variant="compact">
                    <Button
                      variant="contextIcon"
                      title={t('issueImporters.wizard.projects.removeMapping', {
                        defaultValue: 'Remove mapping',
                      })}
                      aria-label={t('issueImporters.wizard.projects.removeMapping', {
                        defaultValue: 'Remove mapping',
                      })}
                      onClick={openConfirmRemove}
                      fullWidth={false}
                      shape="circle">
                      <LucideIcon icon={Trash2} size={24} />
                    </Button>
                  </ContextButtonWrapper>
                )}
                <ContextBarDivider />
                <ContextButtonClose variant="compact" />
              </ContextBar>
            </ContextAnimatePresence>
          )}
        </AnimatePresence>
      </ContextBody>
      <Modal open={isSelectorOpen} onClose={handleSelectorClose}>
        <ProjectMappingSelector
          importerType={importerType}
          externalProject={externalProject}
          lasiusProjects={lasiusProjects}
          selectedProjectId={selectedProjectId}
          existingTagConfig={existingTagConfig}
          onSelect={(projectId, tagConfig) => {
            onMappingChange(externalProject.id, projectId, tagConfig)
            handleSelectorClose()
          }}
          onCancel={handleSelectorClose}
        />
      </Modal>
      <GenericConfirmModal
        open={isConfirmRemoveOpen}
        onClose={() => setIsConfirmRemoveOpen(false)}
        onConfirm={handleConfirmRemove}
        title={t('issueImporters.wizard.projects.confirmRemoveTitle', {
          defaultValue: 'Remove Project Mapping',
        })}
        message={t('issueImporters.wizard.projects.confirmRemoveMessage', {
          defaultValue:
            'Are you sure you want to remove this project mapping? Issues will stop syncing, but existing tags will remain.',
        })}
        confirmLabel={t('actions.remove', { defaultValue: 'Remove' })}
        cancelLabel={t('actions.cancel', { defaultValue: 'Cancel' })}
        confirmVariant="error"
        alert={{
          variant: 'warning',
          message: t('issueImporters.wizard.projects.confirmRemoveWarning', {
            defaultValue: 'This action cannot be undone.',
          }),
        }}
      />
    </>
  )
}
