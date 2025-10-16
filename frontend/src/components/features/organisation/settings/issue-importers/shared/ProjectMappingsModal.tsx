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

import {
  buildMappingPayload,
  extractExternalProjectId,
  type TagConfiguration,
} from 'components/features/issue-importers/lib/mappingHelpers'
import { getImporterTypeLabel } from 'components/features/issue-importers/shared/types'
import { Button } from 'components/primitives/buttons/Button'
import { useToast } from 'components/ui/feedback/hooks/useToast'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { ModalCloseButton } from 'components/ui/overlays/modal/ModalCloseButton'
import { ModalHeader } from 'components/ui/overlays/modal/ModalHeader'
import {
  getGetConfigsKey,
  removeProjectMapping,
  useAddProjectMapping,
} from 'lib/api/lasius/issue-importers/issue-importers'
import { logger } from 'lib/logger'
import { useTranslation } from 'next-i18next'
import React, { useCallback, useState } from 'react'
import { mutate } from 'swr'

import { type MappingWithTagConfig, ProjectMappingList } from './ProjectMappingList'

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type { ModelsIssueImporterConfigId, ModelsIssueImporterConfigResponse } from 'lib/api/lasius'

type Props = {
  open: boolean
  onClose: () => void
  config: ModelsIssueImporterConfigResponse
  orgId: string
}

export const ProjectMappingsModal: React.FC<Props> = ({ open, onClose, config, orgId }) => {
  const { t } = useTranslation('integrations')
  const { addToast } = useToast()
  const [mappings, setMappings] = useState<Record<string, MappingWithTagConfig>>({})

  const importerType = (config?.importerType as ImporterType) || 'github'
  const configId = (config?.id as ModelsIssueImporterConfigId) || ''

  const { trigger: addMapping } = useAddProjectMapping(orgId, configId)

  // Build initial mappings from config.projects with tag configs
  React.useEffect(() => {
    if (config?.projects) {
      const initialMappings: Record<string, MappingWithTagConfig> = {}

      config.projects.forEach((mapping) => {
        const externalId = extractExternalProjectId(importerType, mapping)
        const existingTagConfig = (mapping as any).settings?.tagConfiguration

        if (externalId && mapping.projectId) {
          initialMappings[externalId] = {
            projectId: mapping.projectId,
            tagConfig: existingTagConfig,
          }
        }
      })

      setMappings(initialMappings)
    }
  }, [config?.projects, importerType])

  // Clean up mappings state when modal closes
  React.useEffect(() => {
    if (!open) {
      setMappings({})
    }
  }, [open])

  const handleMappingChange = useCallback(
    async (
      externalProjectId: string,
      lasiusProjectId: string | null,
      tagConfig?: TagConfiguration,
      externalProjectName?: string,
    ) => {
      const previousMapping = mappings[externalProjectId]

      // Update local state immediately
      setMappings((prev) => {
        const updated = { ...prev }
        if (lasiusProjectId) {
          updated[externalProjectId] = {
            projectId: lasiusProjectId,
            tagConfig,
          }
        } else {
          delete updated[externalProjectId]
        }
        return updated
      })

      // Save immediately when mapping changes
      if (!lasiusProjectId) {
        // Remove the mapping
        if (!previousMapping) {
          // No previous mapping to remove
          return
        }

        try {
          await removeProjectMapping(orgId, configId, previousMapping.projectId)

          // Invalidate cache
          await mutate(getGetConfigsKey(orgId, { type: importerType as any }))

          addToast({
            message: t('issueImporters.success.mappingRemoved', {
              defaultValue: 'Project mapping removed successfully',
            }),
            type: 'SUCCESS',
          })
        } catch (error) {
          logger.error('[ProjectMappingsModal] Failed to remove mapping:', error)
          // Restore the mapping on error
          setMappings((prev) => ({ ...prev, [externalProjectId]: previousMapping }))
          addToast({
            message: t('issueImporters.errors.mappingRemoveFailed', {
              defaultValue: 'Failed to remove project mapping',
            }),
            type: 'ERROR',
          })
        }
        return
      }

      try {
        // Build platform-specific mapping payload using helper
        const result = buildMappingPayload(
          importerType,
          externalProjectId,
          lasiusProjectId,
          tagConfig,
          externalProjectName,
        )

        if (!result.success) {
          logger.error('[ProjectMappingsModal] Mapping payload build failed:', result.error)
          addToast({
            message: t('issueImporters.errors.invalidMappingData', {
              defaultValue: result.error,
            }),
            type: 'ERROR',
          })
          return
        }

        await addMapping(result.payload)

        // Invalidate cache
        await mutate(getGetConfigsKey(orgId, { type: importerType as any }))

        addToast({
          message: t('issueImporters.success.mappingSaved', {
            defaultValue: 'Project mapping saved successfully',
          }),
          type: 'SUCCESS',
        })
      } catch (error) {
        logger.error('[ProjectMappingsModal] Failed to save mapping:', error)
        addToast({
          message: t('issueImporters.errors.mappingSaveFailed', {
            defaultValue: 'Failed to save project mapping',
          }),
          type: 'ERROR',
        })
      }
    },
    [importerType, orgId, configId, mappings, addMapping, addToast, t],
  )

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="flex h-full flex-1 flex-col">
        <ModalCloseButton onClose={onClose} />

        <ModalHeader helpKey="modal-project-mappings" className="mb-4">
          {t('issueImporters.projectMappings.title', {
            defaultValue: '{{platform}} Project Mappings',
            platform: getImporterTypeLabel(importerType, t),
          })}
        </ModalHeader>

        <ProjectMappingList
          importerType={importerType}
          configId={configId}
          orgId={orgId}
          initialMappings={mappings}
          showMappedCount
          onMappingChange={handleMappingChange}
        />

        <div className="mt-6 min-h-0">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            {t('actions.close', { defaultValue: 'Close' })}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
