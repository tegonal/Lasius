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

import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { GenericConfirmModal } from '~/components/ui/overlays/modal/generic-confirm-modal'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { ContextButtonClose } from '~/features/context-menu/buttons/context-button-close'
import { ContextButtonOpen } from '~/features/context-menu/buttons/context-button-open'
import { ContextAnimatePresence } from '~/features/context-menu/context-animate-presence'
import { ContextBar } from '~/features/context-menu/context-bar'
import { ContextBarDivider } from '~/features/context-menu/context-bar-divider'
import { ContextBody } from '~/features/context-menu/context-body'
import { ContextButtonWrapper } from '~/features/context-menu/context-button-wrapper'
import { useContextMenu } from '~/features/context-menu/hooks/use-context-menu'
import { ProjectMappingSelector } from '~/features/integrations/components/wizard/steps/project-mapping-selector'
import { type TagConfiguration } from '~/features/integrations/lib/mapping-helpers'
import { useProjects } from '~/features/projects/hooks/use-projects'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import { type ModelsExternalProject } from '~/services/api/lasius'

type Props = {
  existingTagConfig?: TagConfiguration
  externalProject: ModelsExternalProject
  importerType: ImporterType
  onMappingChange: (
    externalProjectId: string,
    lasiusProjectId: null | string,
    tagConfig?: TagConfiguration,
  ) => void
  selectedProjectId?: string
}

export const ProjectMappingRowContext = ({
  existingTagConfig,
  externalProject,
  importerType,
  onMappingChange,
  selectedProjectId,
}: Props) => {
  const { t } = useTranslation('integrations')
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false)
  const { currentOpenContextMenuId, handleCloseAll } = useContextMenu()
  const { userProjects } = useProjects()

  // Build suggestion list from user projects
  const lasiusProjects = userProjects.map((p) => ({
    id: p.projectReference.id,
    key: p.projectReference.key,
  }))

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
    onMappingChange(externalProject.id, null)
    setIsConfirmRemoveOpen(false)
  }

  return (
    <>
      <ContextBody variant="compact">
        <ContextButtonOpen hash={externalProject.id} />
        {currentOpenContextMenuId === externalProject.id && (
          <ContextAnimatePresence variant="compact">
            <ContextBar>
              <ContextButtonWrapper variant="compact">
                <Button
                  aria-label={
                    selectedProjectId
                      ? t('issueImporters.wizard.projects.changeMapping', {
                          defaultValue: 'Change mapping',
                        })
                      : t('issueImporters.wizard.projects.addMapping', {
                          defaultValue: 'Add mapping',
                        })
                  }
                  fullWidth={false}
                  onClick={openSelector}
                  shape="circle"
                  title={
                    selectedProjectId
                      ? t('issueImporters.wizard.projects.changeMapping', {
                          defaultValue: 'Change mapping',
                        })
                      : t('issueImporters.wizard.projects.addMapping', {
                          defaultValue: 'Add mapping',
                        })
                  }
                  variant="contextIcon"
                >
                  <LucideIcon
                    icon={selectedProjectId ? Pencil : Plus}
                    size={24}
                  />
                </Button>
              </ContextButtonWrapper>
              {selectedProjectId && (
                <ContextButtonWrapper variant="compact">
                  <Button
                    aria-label={t(
                      'issueImporters.wizard.projects.removeMapping',
                      {
                        defaultValue: 'Remove mapping',
                      },
                    )}
                    fullWidth={false}
                    onClick={openConfirmRemove}
                    shape="circle"
                    title={t('issueImporters.wizard.projects.removeMapping', {
                      defaultValue: 'Remove mapping',
                    })}
                    variant="contextIcon"
                  >
                    <LucideIcon icon={Trash2} size={24} />
                  </Button>
                </ContextButtonWrapper>
              )}
              <ContextBarDivider />
              <ContextButtonClose variant="compact" />
            </ContextBar>
          </ContextAnimatePresence>
        )}
      </ContextBody>
      <Modal onClose={handleSelectorClose} open={isSelectorOpen} size="lg">
        <ProjectMappingSelector
          existingTagConfig={existingTagConfig}
          externalProject={externalProject}
          importerType={importerType}
          lasiusProjects={lasiusProjects}
          onCancel={handleSelectorClose}
          onSelect={(projectId, tagConfig) => {
            onMappingChange(externalProject.id, projectId, tagConfig)
            handleSelectorClose()
          }}
          selectedProjectId={selectedProjectId}
        />
      </Modal>
      <GenericConfirmModal
        confirmLabel={t('actions.remove', { defaultValue: 'Remove' })}
        confirmVariant="error"
        message={t('issueImporters.wizard.projects.confirmRemoveMessage', {
          defaultValue:
            'Are you sure you want to remove this project mapping? Issues will stop syncing, but existing tags will remain.',
        })}
        onClose={() => setIsConfirmRemoveOpen(false)}
        onConfirm={handleConfirmRemove}
        open={isConfirmRemoveOpen}
        title={t('issueImporters.wizard.projects.confirmRemoveTitle', {
          defaultValue: 'Remove Project Mapping',
        })}
      />
    </>
  )
}
