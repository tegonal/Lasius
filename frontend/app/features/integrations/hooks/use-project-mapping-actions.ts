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

import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { useToast } from '~/components/ui/feedback/use-toast'
import { useRefreshTagsWithToasts } from '~/features/integrations/hooks/use-refresh-tags-with-toasts'
import {
  buildMappingPayload,
  type MappingsByExternalProject,
  type TagConfig,
} from '~/features/integrations/lib/mapping-helpers'
import { logger } from '~/lib/logger'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import {
  type ModelsExternalProject,
  type ModelsIssueImporterConfigResponse,
} from '~/services/api/lasius'
import {
  useAddProjectMapping,
  useRemoveProjectMapping,
} from '~/services/api/lasius-hooks/issue-importers/issue-importers'

type UseProjectMappingActionsOptions = {
  configId: string
  importerType: ImporterType
  mappings: MappingsByExternalProject
  projects: ModelsExternalProject[]
  removeMapping: (externalProjectId: string, lasiusProjectId: string) => void
  selectedOrgId: string
  /** Takes the backend ids of the saved mappings into the local state. */
  syncFromConfig: (config: ModelsIssueImporterConfigResponse) => void
  upsertMapping: (
    externalProjectId: string,
    lasiusProjectId: string,
    tagConfig: TagConfig | undefined,
  ) => void
}

/** Saves, removes and refreshes project mappings, and keeps the local mapping state in step. */
export const useProjectMappingActions = ({
  configId,
  importerType,
  mappings,
  projects,
  removeMapping,
  selectedOrgId,
  syncFromConfig,
  upsertMapping,
}: UseProjectMappingActionsOptions) => {
  const { t } = useTranslation('integrations')
  const { addToast } = useToast()
  const revalidator = useRevalidator()

  const { submit: addMapping } = useAddProjectMapping({
    onError: () => {
      addToast({
        message: t('issueImporters.errors.mappingSaveFailed', {
          defaultValue: 'Failed to save project mapping',
        }),
        type: 'ERROR',
      })
    },
    onSuccess: (config) => {
      syncFromConfig(config)
      void revalidator.revalidate()
      addToast({
        message: t('issueImporters.success.mappingSaved', {
          defaultValue: 'Project mapping saved successfully',
        }),
        type: 'SUCCESS',
      })
    },
  })

  const { submit: deleteMapping } = useRemoveProjectMapping({
    onError: () => {
      addToast({
        message: t('issueImporters.errors.mappingRemoveFailed', {
          defaultValue: 'Failed to remove project mapping',
        }),
        type: 'ERROR',
      })
    },
    onSuccess: (config) => {
      syncFromConfig(config)
      void revalidator.revalidate()
      addToast({
        message: t('issueImporters.success.mappingRemoved', {
          defaultValue: 'Project mapping removed successfully',
        }),
        type: 'SUCCESS',
      })
    },
  })

  const { submit: refreshTagsOfMapping } = useRefreshTagsWithToasts()

  const upsert = (
    externalProjectId: string,
    lasiusProjectId: string,
    tagConfig: TagConfig | undefined,
  ) => {
    const externalProject = projects.find((p) => p.id === externalProjectId)
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
        message: t('issueImporters.errors.invalidMappingData', { defaultValue: result.error }),
        type: 'ERROR',
      })
      return
    }
    upsertMapping(externalProjectId, lasiusProjectId, tagConfig)
    addMapping({ body: result.payload, configId, orgId: selectedOrgId })
  }

  const remove = (externalProjectId: string, lasiusProjectId: string) => {
    const mappingToRemove = (mappings[externalProjectId] ?? []).find(
      (m) => m.projectId === lasiusProjectId,
    )
    if (!mappingToRemove) return
    removeMapping(externalProjectId, lasiusProjectId)
    // A mapping without an id was never saved, so the backend has nothing to delete.
    if (!mappingToRemove.id) {
      logger.warn('[ProjectMappingsModal] Removing mapping without ID — not persisted yet')
      return
    }
    deleteMapping({ configId, mappingId: mappingToRemove.id, orgId: selectedOrgId })
  }

  const refreshTags = (mappingIdValue: string) => {
    refreshTagsOfMapping({ configId, mappingId: { value: mappingIdValue }, orgId: selectedOrgId })
  }

  return { refreshTags, removeMapping: remove, upsertMapping: upsert }
}
