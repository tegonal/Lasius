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

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Heading } from '~/components/primitives/typography/heading'
import { ProjectMappingDataList } from '~/features/integrations/components/shared/project-mapping-data-list'
import {
  type MappingWithTagConfig,
  type TagConfiguration,
} from '~/features/integrations/lib/mapping-helpers'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import {
  type ModelsExternalProject,
  type ModelsIssueImporterConfigId,
  type ModelsListProjectsResponse,
} from '~/services/api/lasius'
import { useListProjects } from '~/services/api/lasius-hooks/issue-importers/issue-importers'

type Props = {
  configId: ModelsIssueImporterConfigId
  importerType: ImporterType
  onMappingsChange: (mappings: Record<string, MappingWithTagConfig>) => void
  onProjectsLoaded?: (projects: ModelsExternalProject[]) => void
  orgId: string
}

export const ListProjectsStep = ({
  configId,
  importerType,
  onMappingsChange,
  onProjectsLoaded,
  orgId,
}: Props) => {
  const { t } = useTranslation('integrations')
  const [mappings, setMappings] = useState<
    Record<string, MappingWithTagConfig>
  >({})

  const [projects, setProjects] = useState<ModelsExternalProject[]>([])
  const [fetchError, setFetchError] = useState<null | string>(null)
  const hasFetchedRef = useRef(false)
  const lastConfigIdRef = useRef(configId)
  const onProjectsLoadedRef = useRef(onProjectsLoaded)
  onProjectsLoadedRef.current = onProjectsLoaded

  const { isError, isLoading, submit } = useListProjects({
    onError: () => {
      setFetchError('Failed to load projects')
    },
    onSuccess: (response: ModelsListProjectsResponse) => {
      const loadedProjects = response?.projects ?? []
      setProjects(loadedProjects)
      setFetchError(null)
      if (onProjectsLoadedRef.current && loadedProjects.length > 0) {
        onProjectsLoadedRef.current(loadedProjects)
      }
    },
  })

  // Reset fetch flag when configId changes
  useEffect(() => {
    if (lastConfigIdRef.current !== configId) {
      hasFetchedRef.current = false
      lastConfigIdRef.current = configId
    }
  }, [configId])

  // Fetch projects on mount
  useEffect(() => {
    if (hasFetchedRef.current) return

    hasFetchedRef.current = true
    submit({ configId, orgId })
  }, [configId, orgId, submit])

  const onMappingsChangeRef = useRef(onMappingsChange)
  onMappingsChangeRef.current = onMappingsChange

  // Sync mappings to parent whenever they change
  useEffect(() => {
    onMappingsChangeRef.current(mappings)
  }, [mappings])

  const handleMappingChange = useCallback(
    (
      externalProjectId: string,
      lasiusProjectId: null | string,
      tagConfig: TagConfiguration | undefined,
    ) => {
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
    },
    [],
  )

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
        onMappingChange={handleMappingChange}
        projects={projects}
      />
    </div>
  )
}
