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

import { AlertTriangle, ArrowRight, FolderOpen, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Heading } from '~/components/primitives/typography/heading'
import { Text } from '~/components/primitives/typography/text'
import { DataList } from '~/components/ui/data-display/data-list/data-list'
import { DataListField } from '~/components/ui/data-display/data-list/data-list-field'
import { DataListHeaderItem } from '~/components/ui/data-display/data-list/data-list-header-item'
import { DataListRow } from '~/components/ui/data-display/data-list/data-list-row'
import { Loading } from '~/components/ui/data-display/loading'
import { Alert } from '~/components/ui/feedback/alert'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { ProjectMappingRowContext } from '~/features/integrations/components/wizard/steps/project-mapping-row-context'
import { getImporterTypeLabel } from '~/features/integrations/lib/importer-type-labels'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import {
  type ModelsExternalProject,
  type ModelsGithubTagConfiguration,
  type ModelsGitlabTagConfiguration,
  type ModelsIssueImporterConfigId,
  type ModelsListProjectsResponse,
  type ModelsPlaneTagConfiguration,
} from '~/services/api/lasius'
import { useListProjects } from '~/services/api/lasius-hooks/issue-importers/issue-importers'

export type MappingWithTagConfig = {
  projectId: string
  tagConfig?: TagConfiguration
}

type Props = {
  configId: ModelsIssueImporterConfigId
  importerType: ImporterType
  onMappingsChange: (mappings: Record<string, MappingWithTagConfig>) => void
  onProjectsLoaded?: (projects: ModelsExternalProject[]) => void
  orgId: string
}

type TagConfiguration =
  | ModelsGithubTagConfiguration
  | ModelsGitlabTagConfiguration
  | ModelsPlaneTagConfiguration

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
  const [filterText, setFilterText] = useState('')

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
        onMappingsChange(updated)
        return updated
      })
    },
    [onMappingsChange],
  )

  // Filter projects by name or ID
  const filteredProjects = useMemo(() => {
    if (!filterText.trim()) return projects

    const searchLower = filterText.toLowerCase()
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchLower) ||
        project.id.toLowerCase().includes(searchLower),
    )
  }, [projects, filterText])

  // Detect orphaned mappings (mappings to projects no longer in the platform)
  const orphanedMappings = useMemo(() => {
    const externalProjectIds = new Set(projects.map((p) => p.id))
    const orphaned: Array<{
      externalId: string
      mapping: MappingWithTagConfig
    }> = []

    Object.entries(mappings).forEach(([externalId, mapping]) => {
      if (!externalProjectIds.has(externalId)) {
        orphaned.push({ externalId, mapping })
      }
    })

    return orphaned
  }, [projects, mappings])

  // Sort projects: mapped first, then unmapped
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      const aMapped = !!mappings[a.id]
      const bMapped = !!mappings[b.id]

      if (aMapped && !bMapped) return -1
      if (!aMapped && bMapped) return 1
      return 0
    })
  }, [filteredProjects, mappings])

  const mappedCount = Object.keys(mappings).length
  const showFilter = projects.length > 10

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Loading />
        <p className="text-base-content/70 mt-4">
          {t('issueImporters.wizard.projects.loading', {
            defaultValue: 'Loading projects from {{platform}}...',
            platform: getImporterTypeLabel(importerType, t),
          })}
        </p>
      </div>
    )
  }

  if (isError || fetchError) {
    return (
      <div className="flex h-full flex-col">
        <Alert className="mt-4" variant="error">
          <p className="text-sm">
            {t('issueImporters.wizard.projects.loadError', {
              defaultValue: 'Failed to load projects. Please try again.',
            })}
          </p>
        </Alert>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="bg-base-200 mt-6 flex flex-col items-center justify-center rounded-lg p-8">
        <LucideIcon
          className="text-base-content/30"
          icon={FolderOpen}
          size={64}
        />
        <p className="text-base-content/60 mt-4">
          {t('issueImporters.wizard.projects.noProjects', {
            defaultValue: 'No projects found in {{platform}}',
            platform: getImporterTypeLabel(importerType, t),
          })}
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 grow flex-col">
      <Heading variant="section">
        {t('issueImporters.wizard.projects.title', {
          defaultValue: 'Map External Projects',
        })}
      </Heading>

      <Text className="mt-2" variant="infoText">
        {t('issueImporters.wizard.projects.mappingCount', {
          count: projects.length,
          defaultValue:
            'Found {{count}} projects from {{platform}}. Map them to your Lasius projects to import issues. {{mapped}} of {{total}} mapped.',
          mapped: mappedCount,
          platform: getImporterTypeLabel(importerType, t),
          total: projects.length,
        })}
      </Text>

      {showFilter && (
        <div className="mt-4 min-h-0">
          <div className="join w-full">
            <Input
              className="join-item"
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t(
                'issueImporters.wizard.projects.filterPlaceholder',
                {
                  defaultValue: 'Filter projects...',
                },
              )}
              type="text"
              value={filterText}
            />
            {filterText && (
              <Button
                aria-label={t('clear', { defaultValue: 'Clear' })}
                className="join-item"
                fullWidth={false}
                onClick={() => setFilterText('')}
                variant="neutral"
              >
                <LucideIcon icon={X} size={16} />
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 overflow-y-auto">
        <DataList>
          <DataListRow>
            <DataListHeaderItem>
              {t('issueImporters.wizard.projects.externalProject', {
                defaultValue: 'External Project',
              })}
            </DataListHeaderItem>
            <DataListHeaderItem />
            <DataListHeaderItem>
              {t('issueImporters.wizard.projects.lasiusProject', {
                defaultValue: 'Lasius Project',
              })}
            </DataListHeaderItem>
            <DataListHeaderItem />
          </DataListRow>
          {orphanedMappings.map(({ externalId, mapping }) => (
            <DataListRow key={`orphaned-${externalId}`}>
              <DataListField>
                <div className="flex items-center gap-3">
                  <LucideIcon
                    className="text-warning flex-shrink-0"
                    icon={AlertTriangle}
                    size={20}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-base-content/60 truncate font-medium">
                      {t('issueImporters.wizard.projects.orphanedProject', {
                        defaultValue: 'Project no longer available',
                      })}
                    </p>
                    <p className="text-base-content/50 truncate text-xs">
                      {externalId}
                    </p>
                  </div>
                </div>
              </DataListField>
              <DataListField width={48}>
                <div className="flex items-center justify-center">
                  <LucideIcon
                    className="text-base-content/30"
                    icon={ArrowRight}
                    size={20}
                  />
                </div>
              </DataListField>
              <DataListField>
                <div className="flex items-center gap-2">
                  <LucideIcon
                    className="text-primary flex-shrink-0"
                    icon={FolderOpen}
                    size={16}
                  />
                  <span className="text-sm">{mapping.projectId}</span>
                </div>
              </DataListField>
              <DataListField>
                <ProjectMappingRowContext
                  existingTagConfig={mapping.tagConfig}
                  externalProject={{
                    id: externalId,
                    name: externalId,
                    ownerType: 'User',
                  }}
                  importerType={importerType}
                  onMappingChange={handleMappingChange}
                  selectedProjectId={mapping.projectId}
                />
              </DataListField>
            </DataListRow>
          ))}
          {sortedProjects.map((project) => (
            <DataListRow key={project.id}>
              <DataListField>
                <div className="flex items-center gap-3">
                  <LucideIcon
                    className="text-base-content/60 flex-shrink-0"
                    icon={FolderOpen}
                    size={20}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{project.name}</p>
                    <p className="text-base-content/50 truncate text-xs">
                      {project.id}
                    </p>
                  </div>
                </div>
              </DataListField>
              <DataListField width={48}>
                <div className="flex items-center justify-center">
                  <LucideIcon
                    className="text-base-content/30"
                    icon={ArrowRight}
                    size={20}
                  />
                </div>
              </DataListField>
              <DataListField>
                {mappings[project.id] ? (
                  <div className="flex items-center gap-2">
                    <LucideIcon
                      className="text-primary flex-shrink-0"
                      icon={FolderOpen}
                      size={16}
                    />
                    <span className="text-sm">
                      {mappings[project.id]?.projectId}
                    </span>
                  </div>
                ) : (
                  <span className="text-base-content/50 text-sm">
                    {t('issueImporters.wizard.projects.notMapped', {
                      defaultValue: 'Not mapped',
                    })}
                  </span>
                )}
              </DataListField>
              <DataListField>
                <ProjectMappingRowContext
                  existingTagConfig={mappings[project.id]?.tagConfig}
                  externalProject={project}
                  importerType={importerType}
                  onMappingChange={handleMappingChange}
                  selectedProjectId={mappings[project.id]?.projectId}
                />
              </DataListField>
            </DataListRow>
          ))}
        </DataList>
      </div>
    </div>
  )
}
