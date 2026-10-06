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

import { Heading } from '~/components/primitives/typography/heading'
import { ProjectMappingDataList } from '~/features/integrations/components/shared/project-mapping-data-list'
import { useMappingState } from '~/features/integrations/hooks/use-mapping-state'
import { type MappingsByExternalProject } from '~/features/integrations/lib/mapping-helpers'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import {
  type ModelsExternalProject,
  type ModelsIssueImporterConfigId,
  type ModelsListProjectsResponse,
} from '~/services/api/lasius'
import { useListProjects } from '~/services/api/lasius-hooks/issue-importers/issue-importers'

type Properties = {
  configId: ModelsIssueImporterConfigId
  importerType: ImporterType
  onMappingsChange: (mappings: MappingsByExternalProject) => void
  onProjectsLoaded?: (projects: ModelsExternalProject[]) => void
  orgId: string
}

export const ListProjectsStep = ({
  configId,
  importerType,
  onMappingsChange,
  onProjectsLoaded,
  orgId,
}: Properties) => {
  const { t } = useTranslation('integrations')
  const { mappings, removeMapping, upsertMapping } = useMappingState()

  const [projects, setProjects] = useState<ModelsExternalProject[]>([])
  const [fetchError, setFetchError] = useState<null | string>(null)
  const hasFetchedReference = useRef(false)
  const lastConfigIdReference = useRef(configId)
  const onProjectsLoadedReference = useRef(onProjectsLoaded)
  useEffect(() => {
    onProjectsLoadedReference.current = onProjectsLoaded
  })

  const { isError, isLoading, submit } = useListProjects({
    onError: () => {
      setFetchError('Failed to load projects')
    },
    onSuccess: (response: ModelsListProjectsResponse) => {
      const loadedProjects = response?.projects ?? []
      setProjects(loadedProjects)
      setFetchError(null)
      if (onProjectsLoadedReference.current && loadedProjects.length > 0) {
        onProjectsLoadedReference.current(loadedProjects)
      }
    },
  })

  // Reset fetch flag when configId changes
  useEffect(() => {
    if (lastConfigIdReference.current === configId) {
      return
    }

    hasFetchedReference.current = false
    lastConfigIdReference.current = configId
  }, [configId])

  // Fetch projects on mount
  useEffect(() => {
    if (hasFetchedReference.current) return

    hasFetchedReference.current = true
    submit({ configId, orgId })
  }, [configId, orgId, submit])

  const onMappingsChangeReference = useRef(onMappingsChange)
  // This effect must stay above the sync effect, so that the sync effect calls the current callback.
  useEffect(() => {
    onMappingsChangeReference.current = onMappingsChange
  })

  // Sync mappings to parent whenever they change
  useEffect(() => {
    onMappingsChangeReference.current(mappings)
  }, [mappings])

  return (
    <div className="flex min-h-0 flex-1 grow flex-col">
      <Heading variant="section">
        {t('issueImporters.wizard.projects.title', {
          defaultValue: 'Map External Projects',
        })}
      </Heading>

      <ProjectMappingDataList
        importerType={importerType}
        isError={isError || !!fetchError}
        isLoading={isLoading}
        mappings={mappings}
        onMappingRemove={removeMapping}
        onMappingUpsert={upsertMapping}
        projects={projects}
      />
    </div>
  )
}
