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

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { ModalHelpButton } from '~/features/help/components/help-button'
import { ProjectMappingDataList } from '~/features/integrations/components/shared/project-mapping-data-list'
import { useMappingState } from '~/features/integrations/hooks/use-mapping-state'
import { useProjectMappingActions } from '~/features/integrations/hooks/use-project-mapping-actions'
import { getImporterTypeLabel } from '~/features/integrations/lib/importer-type-labels'
import { applySavedIds, buildInitialMappings } from '~/features/integrations/lib/mapping-helpers'
import { untyped } from '~/lib/i18n-types'
import {
  type ModelsExternalProject,
  type ModelsIssueImporterConfigResponse,
  type ModelsListProjectsResponse,
} from '~/services/api/lasius'
import { useListProjects } from '~/services/api/lasius-hooks/issue-importers/issue-importers'

type Properties = {
  config: ModelsIssueImporterConfigResponse
  onClose: () => void
  selectedOrgId: string
}

const projectIdsKey = (config: ModelsIssueImporterConfigResponse) =>
  JSON.stringify(config.projects?.map((p) => p.projectId).toSorted((a, b) => a.localeCompare(b)))

/**
 * The body of the mappings modal. The closed Modal unmounts it, so each open starts with fresh
 * state and one fetch of the external projects.
 */
export const ProjectMappingsModalContent = ({ config, onClose, selectedOrgId }: Properties) => {
  const { t } = useTranslation('integrations')
  const { mappings, removeMapping, setMappings, upsertMapping } = useMappingState()
  const importerType = config.importerType || 'github'
  const configId = config.id

  // The mappings initialize from the saved projects of the config, and again for another config.
  const configProjectsKey = projectIdsKey(config)
  const [syncedKey, setSyncedKey] = useState<null | string>(null)
  if (syncedKey !== configProjectsKey) {
    setSyncedKey(configProjectsKey)
    setMappings(buildInitialMappings(importerType, config.projects ?? []))
  }

  const [projects, setProjects] = useState<ModelsExternalProject[]>([])
  const [fetchError, setFetchError] = useState<null | string>(null)
  const {
    isError: isListError,
    isLoading: isListLoading,
    submit: listProjects,
  } = useListProjects({
    onError: () => setFetchError('Failed to load projects'),
    onSuccess: (response: ModelsListProjectsResponse) => {
      setProjects(response?.projects ?? [])
      setFetchError(null)
    },
  })

  const hasFetchedReference = useRef(false)
  useEffect(() => {
    if (!configId || hasFetchedReference.current) return
    hasFetchedReference.current = true
    listProjects({ configId, orgId: selectedOrgId })
  }, [configId, selectedOrgId, listProjects])

  const actions = useProjectMappingActions({
    configId,
    importerType,
    mappings,
    projects,
    removeMapping,
    selectedOrgId,
    syncFromConfig: (saved) =>
      setMappings((local) =>
        applySavedIds(local, buildInitialMappings(importerType, saved.projects ?? [])),
      ),
    upsertMapping,
  })

  return (
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
        importerConfig={{ configId, orgId: selectedOrgId }}
        importerType={importerType}
        isError={isListError || !!fetchError}
        isLoading={isListLoading}
        mappings={mappings}
        onMappingRemove={actions.removeMapping}
        onMappingUpsert={actions.upsertMapping}
        onRefreshTags={actions.refreshTags}
        projects={projects}
      />

      <div className="mt-6 min-h-0">
        <Button className="w-full" onClick={onClose} type="button" variant="secondary">
          {t('actions.close', { defaultValue: 'Close' })}
        </Button>
      </div>
    </div>
  )
}
