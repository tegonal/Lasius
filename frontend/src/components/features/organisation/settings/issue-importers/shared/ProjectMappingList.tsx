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

import { getImporterTypeLabel } from 'components/features/issue-importers/shared/types'
import { Button } from 'components/primitives/buttons/Button'
import { Input } from 'components/primitives/inputs/Input'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import { Text } from 'components/primitives/typography/Text'
import { DataList } from 'components/ui/data-display/dataList/dataList'
import { DataListField } from 'components/ui/data-display/dataList/dataListField'
import { DataListHeaderItem } from 'components/ui/data-display/dataList/dataListHeaderItem'
import { DataListRow } from 'components/ui/data-display/dataList/dataListRow'
import { Loading } from 'components/ui/data-display/fetchState/loading'
import { Alert } from 'components/ui/feedback/Alert'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { useProjects } from 'lib/api/hooks/useProjects'
import { lasiusAxiosInstance } from 'lib/api/lasiusAxiosInstance'
import { AlertTriangle, ArrowRight, FolderOpen, X } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useMemo, useState } from 'react'
import useSWR from 'swr'

import { ProjectMappingRowContext } from '../wizard/steps/ProjectMappingRowContext'

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type {
  ModelsExternalProject,
  ModelsGithubTagConfiguration,
  ModelsGitlabTagConfiguration,
  ModelsIssueImporterConfigId,
  ModelsListProjectsResponse,
  ModelsPlaneTagConfiguration,
} from 'lib/api/lasius'

type TagConfiguration =
  | ModelsGithubTagConfiguration
  | ModelsGitlabTagConfiguration
  | ModelsPlaneTagConfiguration

export type MappingWithTagConfig = {
  projectId: string
  tagConfig?: TagConfiguration
}

type Props = {
  importerType: ImporterType
  configId: ModelsIssueImporterConfigId
  orgId: string
  initialMappings?: Record<string, MappingWithTagConfig>
  showMappedCount?: boolean
  onMappingChange: (
    externalProjectId: string,
    lasiusProjectId: string | null,
    tagConfig: TagConfiguration | undefined,
  ) => void
  onProjectsLoaded?: (projects: ModelsExternalProject[]) => void
}

/**
 * Shared component for displaying and managing project mappings
 * Used by both the wizard (ListProjectsStep) and the modal (ProjectMappingsModal)
 */
export const ProjectMappingList: React.FC<Props> = ({
  importerType,
  configId,
  orgId,
  initialMappings = {},
  showMappedCount = false,
  onMappingChange,
  onProjectsLoaded,
}) => {
  const { t } = useTranslation('integrations')
  const { projectSuggestions } = useProjects()
  const [mappings, setMappings] = useState<Record<string, MappingWithTagConfig>>(initialMappings)
  const [filterText, setFilterText] = useState('')

  const swrKey = [`/organisations/${orgId}/issue-importers/${configId}/projects`] as const
  const {
    data: projectsResponse,
    error,
    isLoading,
  } = useSWR<ModelsListProjectsResponse>(swrKey, () =>
    lasiusAxiosInstance<ModelsListProjectsResponse>({
      url: `/organisations/${orgId}/issue-importers/${configId}/projects`,
      method: 'GET',
    }),
  )

  // Notify parent when projects are loaded (only once per configId)
  const hasNotifiedRef = React.useRef(false)
  const lastConfigIdRef = React.useRef(configId)

  // Reset notification flag if configId changes
  React.useEffect(() => {
    if (lastConfigIdRef.current !== configId) {
      hasNotifiedRef.current = false
      lastConfigIdRef.current = configId
    }
  }, [configId])

  const projects = useMemo(() => projectsResponse?.projects || [], [projectsResponse?.projects])

  React.useEffect(() => {
    if (projects.length > 0 && !hasNotifiedRef.current && onProjectsLoaded) {
      onProjectsLoaded(projects)
      hasNotifiedRef.current = true
    }
  }, [projects, onProjectsLoaded])

  // Update internal mappings when initial mappings change
  React.useEffect(() => {
    setMappings(initialMappings)
  }, [initialMappings])

  const lasiusProjects = projectSuggestions()

  const handleMappingChange = (
    externalProjectId: string,
    lasiusProjectId: string | null,
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
    onMappingChange(externalProjectId, lasiusProjectId, tagConfig)
  }

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
    const orphaned: Array<{ externalId: string; mapping: MappingWithTagConfig }> = []

    Object.entries(mappings).forEach(([externalId, mapping]) => {
      if (!externalProjectIds.has(externalId)) {
        orphaned.push({ externalId, mapping })
      }
    })

    return orphaned
  }, [projects, mappings])

  // Sort projects: mapped projects first, then unmapped
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      const aMapped = !!mappings[a.id]
      const bMapped = !!mappings[b.id]

      if (aMapped && !bMapped) return -1
      if (!aMapped && bMapped) return 1
      return 0 // Maintain original order within groups
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

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <Alert variant="error" className="mt-4">
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
        <LucideIcon icon={FolderOpen} size={64} className="text-base-content/30" />
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
      {showMappedCount && (
        <Text variant="infoText" className="mt-2">
          {t('issueImporters.wizard.projects.mappingDescription', {
            defaultValue:
              'Found {{count}} projects from {{platform}}. Map them to your Lasius projects to import issues. {{mapped}} of {{total}} mapped.',
            count: projects.length,
            platform: getImporterTypeLabel(importerType, t),
            mapped: mappedCount,
            total: projects.length,
          })}
        </Text>
      )}

      {showFilter && (
        <div className="mt-4 min-h-0">
          <div className="join w-full">
            <Input
              type="text"
              placeholder={t('issueImporters.wizard.projects.filterPlaceholder', {
                defaultValue: 'Filter projects...',
              })}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="join-item"
            />
            {filterText && (
              <Button
                fullWidth={false}
                variant="neutral"
                onClick={() => setFilterText('')}
                className="join-item"
                aria-label={t('clear', { defaultValue: 'Clear' })}>
                <LucideIcon icon={X} size={16} />
              </Button>
            )}
          </div>
        </div>
      )}

      <ScrollContainer className="mt-4">
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
                    icon={AlertTriangle}
                    size={20}
                    className="text-warning flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-base-content/60 truncate font-medium">
                      {t('issueImporters.wizard.projects.orphanedProject', {
                        defaultValue: 'Project no longer available',
                      })}
                    </p>
                    <p className="text-base-content/50 truncate text-xs">{externalId}</p>
                  </div>
                </div>
              </DataListField>
              <DataListField width={48}>
                <div className="flex items-center justify-center">
                  <LucideIcon icon={ArrowRight} size={20} className="text-base-content/30" />
                </div>
              </DataListField>
              <DataListField>
                <div className="flex items-center gap-2">
                  <LucideIcon icon={FolderOpen} size={16} className="text-primary flex-shrink-0" />
                  <span className="text-sm">
                    {lasiusProjects.find((p) => p.id === mapping.projectId)?.key ||
                      mapping.projectId}
                  </span>
                </div>
              </DataListField>
              <DataListField>
                <ProjectMappingRowContext
                  importerType={importerType}
                  externalProject={{ id: externalId, name: externalId, ownerType: 'User' }}
                  lasiusProjects={lasiusProjects}
                  selectedProjectId={mapping.projectId}
                  existingTagConfig={mapping.tagConfig}
                  onMappingChange={handleMappingChange}
                />
              </DataListField>
            </DataListRow>
          ))}
          {sortedProjects.map((project) => (
            <DataListRow key={project.id}>
              <DataListField>
                <div className="flex items-center gap-3">
                  <LucideIcon
                    icon={FolderOpen}
                    size={20}
                    className="text-base-content/60 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{project.name}</p>
                    <p className="text-base-content/50 truncate text-xs">{project.id}</p>
                  </div>
                </div>
              </DataListField>
              <DataListField width={48}>
                <div className="flex items-center justify-center">
                  <LucideIcon icon={ArrowRight} size={20} className="text-base-content/30" />
                </div>
              </DataListField>
              <DataListField>
                {mappings[project.id] ? (
                  <div className="flex items-center gap-2">
                    <LucideIcon
                      icon={FolderOpen}
                      size={16}
                      className="text-primary flex-shrink-0"
                    />
                    <span className="text-sm">
                      {lasiusProjects.find((p) => p.id === mappings[project.id]?.projectId)?.key ||
                        mappings[project.id]?.projectId}
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
                  importerType={importerType}
                  externalProject={project}
                  lasiusProjects={lasiusProjects}
                  selectedProjectId={mappings[project.id]?.projectId}
                  existingTagConfig={mappings[project.id]?.tagConfig}
                  onMappingChange={handleMappingChange}
                />
              </DataListField>
            </DataListRow>
          ))}
        </DataList>
      </ScrollContainer>
    </div>
  )
}
