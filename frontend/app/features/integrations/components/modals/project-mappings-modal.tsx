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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { useToast } from '~/components/ui/feedback/use-toast'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { ModalHelpButton } from '~/features/help/components/help-button'
import { ProjectMappingDataList } from '~/features/integrations/components/shared/project-mapping-data-list'
import { useMappingState } from '~/features/integrations/hooks/use-mapping-state'
import { getImporterTypeLabel } from '~/features/integrations/lib/importer-type-labels'
import {
  buildMappingPayload,
  extractExternalProjectId,
  type ProjectMapping,
  type TagConfig,
} from '~/features/integrations/lib/mapping-helpers'
import { untyped } from '~/lib/i18n-types'
import { logger } from '~/lib/logger'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import {
  type ModelsExternalProject,
  type ModelsIssueImporterConfigId,
  type ModelsIssueImporterConfigResponse,
  type ModelsListProjectsResponse,
  type ModelsProjectMappingId,
} from '~/services/api/lasius'
import {
  useAddProjectMapping,
  useListProjects,
  useRefreshTags,
  useRemoveProjectMapping,
} from '~/services/api/lasius-hooks/issue-importers/issue-importers'

type Properties = {
  config: ModelsIssueImporterConfigResponse | null
  onClose: () => void
  open: boolean
  selectedOrgId: string
}

export const ProjectMappingsModal = ({ config, onClose, open, selectedOrgId }: Properties) => {
  const { t } = useTranslation('integrations')
  const { addToast } = useToast()
  const revalidator = useRevalidator()
  const { mappings, removeMapping, setMappings, upsertMapping } = useMappingState()

  const importerType = (config?.importerType as ImporterType) || 'github'
  const configId = (config?.id as ModelsIssueImporterConfigId) || ''

  // Keep a ref to config.projects so the init effect can read from it
  // without depending on its referential identity
  const configProjectsReference = useRef(config?.projects)
  useEffect(() => {
    configProjectsReference.current = config?.projects
  })
  const configProjectsKey = useMemo(
    () =>
      JSON.stringify(
        config?.projects?.map((p) => p.projectId).toSorted((a, b) => a.localeCompare(b)),
      ),
    [config?.projects],
  )

  // Fetch external projects
  const [projects, setProjects] = useState<ModelsExternalProject[]>([])
  const [fetchError, setFetchError] = useState<null | string>(null)
  const hasFetchedReference = useRef(false)

  // Clear the external projects when the modal closes
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) {
      setProjects([])
    }
  }

  const listProjectsApi = useListProjects({
    onError: () => {
      setFetchError('Failed to load projects')
    },
    onSuccess: (response: ModelsListProjectsResponse) => {
      setProjects(response?.projects ?? [])
      setFetchError(null)
    },
  })

  const mappingAdditionApi = useAddProjectMapping({
    onError: () => {
      addToast({
        message: t('issueImporters.errors.mappingSaveFailed', {
          defaultValue: 'Failed to save project mapping',
        }),
        type: 'ERROR',
      })
    },
    onSuccess: () => {
      void revalidator.revalidate()
      addToast({
        message: t('issueImporters.success.mappingSaved', {
          defaultValue: 'Project mapping saved successfully',
        }),
        type: 'SUCCESS',
      })
    },
  })

  const mappingRemovalApi = useRemoveProjectMapping({
    onError: () => {
      addToast({
        message: t('issueImporters.errors.mappingRemoveFailed', {
          defaultValue: 'Failed to remove project mapping',
        }),
        type: 'ERROR',
      })
    },
    onSuccess: () => {
      void revalidator.revalidate()
      addToast({
        message: t('issueImporters.success.mappingRemoved', {
          defaultValue: 'Project mapping removed successfully',
        }),
        type: 'SUCCESS',
      })
    },
  })

  const refreshTagsApi = useRefreshTags({
    onError: () => {
      addToast({
        message: t('issueImporters.errors.tagsRefreshFailed', {
          defaultValue: 'Failed to refresh tags',
        }),
        type: 'ERROR',
      })
    },
    onSuccess: () => {
      addToast({
        message: t('issueImporters.success.tagsRefreshed', {
          defaultValue: 'Tags refresh triggered successfully',
        }),
        type: 'SUCCESS',
      })
    },
  })

  // Build initial mappings from config.projects (supports multiple mappings per external project)
  useEffect(() => {
    const projects = configProjectsReference.current
    if (projects) {
      const initialMappings: Record<
        string,
        Array<{
          id?: ModelsProjectMappingId
          projectId: string
          tagConfig?: TagConfig
        }>
      > = {}

      for (const mapping of projects as ProjectMapping[]) {
        const externalId = extractExternalProjectId(importerType, mapping)
        const existingTagConfig = (mapping.settings as unknown as { tagConfiguration?: TagConfig })
          ?.tagConfiguration

        if (externalId && mapping.projectId) {
          const existing = initialMappings[externalId] ?? []
          existing.push({
            id: mapping.id,
            projectId: mapping.projectId,
            tagConfig: existingTagConfig,
          })
          initialMappings[externalId] = existing
        }
      }

      setMappings(initialMappings)
    }
  }, [configProjectsKey, importerType, open, setMappings])

  // Clean up state when modal closes
  useEffect(() => {
    if (open) {
      return
    }

    setMappings({})
    hasFetchedReference.current = false
  }, [open, setMappings])

  // Fetch external projects when modal opens
  useEffect(() => {
    if (!open || !configId || hasFetchedReference.current) return

    hasFetchedReference.current = true
    listProjectsApi.submit({ configId, orgId: selectedOrgId })
  }, [open, configId, selectedOrgId, listProjectsApi])

  const projectsReference = useRef(projects)
  useEffect(() => {
    projectsReference.current = projects
  })

  const handleMappingUpsert = useCallback(
    (externalProjectId: string, lasiusProjectId: string, tagConfig: TagConfig | undefined) => {
      upsertMapping(externalProjectId, lasiusProjectId, tagConfig)

      // Add/update via API
      const externalProject = projectsReference.current.find((p) => p.id === externalProjectId)

      const result = buildMappingPayload(
        importerType,
        externalProjectId,
        lasiusProjectId,
        tagConfig,
        externalProject?.name,
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

      mappingAdditionApi.submit({
        body: result.payload,
        configId,
        orgId: selectedOrgId,
      })
    },
    [configId, selectedOrgId, importerType, mappingAdditionApi, addToast, t, upsertMapping],
  )

  const handleMappingRemove = useCallback(
    (externalProjectId: string, lasiusProjectId: string) => {
      const currentMappings = mappings[externalProjectId] ?? []
      const mappingToRemove = currentMappings.find((m) => m.projectId === lasiusProjectId)
      if (!mappingToRemove) return

      removeMapping(externalProjectId, lasiusProjectId)

      // Remove via API — use mapping ID if available (persisted mappings)
      if (mappingToRemove.id) {
        mappingRemovalApi.submit({
          configId,
          mappingId: mappingToRemove.id,
          orgId: selectedOrgId,
        })
      } else {
        logger.warn('[ProjectMappingsModal] Removing mapping without ID — not persisted yet')
      }
    },
    [configId, selectedOrgId, mappingRemovalApi, mappings, removeMapping],
  )

  const handleRefreshTags = useCallback(
    (mappingIdValue: string) => {
      refreshTagsApi.submit({
        configId,
        mappingId: {
          value: mappingIdValue,
        },
        orgId: selectedOrgId,
      })
    },
    [configId, selectedOrgId, refreshTagsApi],
  )

  return (
    <Modal onClose={onClose} open={open} size="lg">
      <div className="flex h-full flex-1 flex-col">
        <ModalCloseButton onClose={onClose} />

        <ModalHeader
          actionSlot={<ModalHelpButton helpKey="modal-project-mappings" />}
          className="mb-4">
          {t('issueImporters.projectMappings.title', {
            defaultValue: '{{platform}} Project Mappings',
            platform: getImporterTypeLabel(importerType, untyped(t)),
          })}
        </ModalHeader>

        <ProjectMappingDataList
          importerType={importerType}
          isError={listProjectsApi.isError || !!fetchError}
          isLoading={listProjectsApi.isLoading}
          mappings={mappings}
          onMappingRemove={handleMappingRemove}
          onMappingUpsert={handleMappingUpsert}
          onRefreshTags={handleRefreshTags}
          projects={projects}
        />

        <div className="mt-6 min-h-0">
          <Button className="w-full" onClick={onClose} type="button" variant="secondary">
            {t('actions.close', { defaultValue: 'Close' })}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
