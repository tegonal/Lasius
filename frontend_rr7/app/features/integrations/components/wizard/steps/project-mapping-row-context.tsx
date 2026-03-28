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

import { FolderOpen, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { GenericConfirmModal } from '~/components/ui/overlays/modal/generic-confirm-modal'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { ContextButtonClose } from '~/features/context-menu/buttons/context-button-close'
import { ContextAnimatePresence } from '~/features/context-menu/context-animate-presence'
import { ContextBar } from '~/features/context-menu/context-bar'
import { ContextBarDivider } from '~/features/context-menu/context-bar-divider'
import { ContextBody } from '~/features/context-menu/context-body'
import { ContextButtonWrapper } from '~/features/context-menu/context-button-wrapper'
import { useContextMenu } from '~/features/context-menu/hooks/use-context-menu'
import { ProjectMappingSelector } from '~/features/integrations/components/wizard/steps/project-mapping-selector'
import {
  type MappingWithTagConfig,
  type TagConfiguration,
} from '~/features/integrations/lib/mapping-helpers'
import { useProjects } from '~/features/projects/hooks/use-projects'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import { type ModelsExternalProject } from '~/services/api/lasius'

type Props = {
  excludeProjectIds: string[]
  externalProject: ModelsExternalProject
  importerType: ImporterType
  lasiusProjects: Array<{ id: string; key: string }>
  mapping: MappingWithTagConfig
  onMappingRemove: (extId: string, projectId: string) => void
  onMappingUpsert: (
    extId: string,
    projectId: string,
    tagConfig?: TagConfiguration,
  ) => void
  onRefreshTags?: (mappingId: string) => void
}

export const ProjectMappingRowContext = ({
  excludeProjectIds,
  externalProject,
  importerType,
  lasiusProjects,
  mapping,
  onMappingRemove,
  onMappingUpsert,
  onRefreshTags,
}: Props) => {
  const { t } = useTranslation('integrations')
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false)
  const { handleCloseAll } = useContextMenu()
  const { findProjectById } = useProjects()

  const projectName =
    findProjectById(mapping.projectId)?.key ?? mapping.projectId

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
    onMappingRemove(externalProject.id, mapping.projectId)
    setIsConfirmRemoveOpen(false)
  }

  return (
    <>
      <ContextBody
        hash={`${externalProject.id}::${mapping.projectId}`}
        variant="compact"
      >
        <div
          aria-label={t('issueImporters.wizard.projects.editMapping', {
            defaultValue: 'Edit Project Mapping',
          })}
          className="badge badge-outline cursor-pointer gap-1"
          onClick={openSelector}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              openSelector()
            }
          }}
          role="button"
          tabIndex={0}
        >
          <LucideIcon className="text-primary" icon={FolderOpen} size={12} />
          <span className="text-xs">{projectName}</span>
          <button
            aria-label={t('issueImporters.wizard.projects.removeMapping', {
              defaultValue: 'Remove mapping',
            })}
            className="btn btn-ghost btn-xs p-0"
            onClick={(e) => {
              e.stopPropagation()
              openConfirmRemove()
            }}
            type="button"
          >
            <LucideIcon icon={X} size={12} />
          </button>
        </div>
        <ContextAnimatePresence inModal variant="compact">
          <ContextBar>
            {onRefreshTags && mapping.id && (
              <ContextButtonWrapper variant="compact">
                <Button
                  aria-label={t('issueImporters.actions.refreshTags', {
                    defaultValue: 'Refresh tags',
                  })}
                  fullWidth={false}
                  onClick={() => {
                    onRefreshTags(mapping.id!.value)
                    handleCloseAll()
                  }}
                  shape="circle"
                  title={t('issueImporters.actions.refreshTags', {
                    defaultValue: 'Refresh tags',
                  })}
                  variant="contextIcon"
                >
                  <LucideIcon icon={RefreshCw} size={24} />
                </Button>
              </ContextButtonWrapper>
            )}
            <ContextBarDivider />
            <ContextButtonClose variant="compact" />
          </ContextBar>
        </ContextAnimatePresence>
      </ContextBody>
      <Modal onClose={handleSelectorClose} open={isSelectorOpen} size="lg">
        <ProjectMappingSelector
          excludeProjectIds={excludeProjectIds}
          existingTagConfig={mapping.tagConfig}
          externalProject={externalProject}
          importerType={importerType}
          lasiusProjects={lasiusProjects}
          onCancel={handleSelectorClose}
          onSelect={(projectId, tagConfig) => {
            if (projectId) {
              onMappingUpsert(externalProject.id, projectId, tagConfig)
            }
            handleSelectorClose()
          }}
          selectedProjectId={mapping.projectId}
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
