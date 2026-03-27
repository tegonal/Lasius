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
  AlertTriangle,
  ArrowRight,
  FolderOpen,
  RefreshCw,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Text } from '~/components/primitives/typography/text'
import { DataList } from '~/components/ui/data-display/data-list/data-list'
import { DataListField } from '~/components/ui/data-display/data-list/data-list-field'
import { DataListHeaderItem } from '~/components/ui/data-display/data-list/data-list-header-item'
import { DataListRow } from '~/components/ui/data-display/data-list/data-list-row'
import { Loading } from '~/components/ui/data-display/loading'
import { Alert } from '~/components/ui/feedback/alert'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { ContextMenuProvider } from '~/features/context-menu/hooks/use-context-menu'
import { ProjectMappingRowContext } from '~/features/integrations/components/wizard/steps/project-mapping-row-context'
import { useProjectMappingList } from '~/features/integrations/hooks/use-project-mapping-list'
import { getImporterTypeLabel } from '~/features/integrations/lib/importer-type-labels'
import {
  type MappingWithTagConfig,
  type TagConfiguration,
} from '~/features/integrations/lib/mapping-helpers'
import { untyped } from '~/lib/i18n-types'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import { type ModelsExternalProject } from '~/services/api/lasius'

type ProjectMappingDataListProps = {
  importerType: ImporterType
  isError: boolean
  isLoading: boolean
  mappings: Record<string, MappingWithTagConfig>
  onMappingChange: (
    externalProjectId: string,
    lasiusProjectId: null | string,
    tagConfig: TagConfiguration | undefined,
  ) => void
  onRefreshTags?: (projectId: string) => void
  projects: ModelsExternalProject[]
}

export const ProjectMappingDataList = ({
  importerType,
  isError,
  isLoading,
  mappings,
  onMappingChange,
  onRefreshTags,
  projects,
}: ProjectMappingDataListProps) => {
  const { t } = useTranslation('integrations')
  const [filterText, setFilterText] = useState('')

  const { mappedCount, orphanedMappings, showFilter, sortedProjects } =
    useProjectMappingList({ filterText, mappings, projects })

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Loading />
        <p className="text-base-content/70 mt-4">
          {t('issueImporters.wizard.projects.loading', {
            defaultValue: 'Loading projects from {{platform}}...',
            platform: getImporterTypeLabel(importerType, untyped(t)),
          })}
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <Alert className="mt-4" variant="error">
        <p className="text-sm">
          {t('issueImporters.wizard.projects.loadError', {
            defaultValue: 'Failed to load projects. Please try again.',
          })}
        </p>
      </Alert>
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
            platform: getImporterTypeLabel(importerType, untyped(t)),
          })}
        </p>
      </div>
    )
  }

  return (
    <ContextMenuProvider>
      <div className="flex min-h-0 flex-1 grow flex-col">
        <Text className="mt-2" variant="infoText">
          {t('issueImporters.wizard.projects.mappingDescription', {
            count: projects.length,
            defaultValue:
              'Found {{count}} projects from {{platform}}. Map them to your Lasius projects to import issues. {{mapped}} of {{total}} mapped.',
            mapped: mappedCount,
            platform: getImporterTypeLabel(importerType, untyped(t)),
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
                  <div className="flex items-center gap-1">
                    {onRefreshTags && (
                      <Button
                        aria-label={t('issueImporters.actions.refreshTags', {
                          defaultValue: 'Refresh tags',
                        })}
                        fullWidth={false}
                        onClick={() => onRefreshTags(mapping.projectId)}
                        size="sm"
                        title={t('issueImporters.actions.refreshTags', {
                          defaultValue: 'Refresh tags',
                        })}
                        variant="ghost"
                      >
                        <LucideIcon icon={RefreshCw} size={14} />
                      </Button>
                    )}
                    <ProjectMappingRowContext
                      existingTagConfig={mapping.tagConfig}
                      externalProject={{
                        id: externalId,
                        name: externalId,
                        ownerType: 'User',
                      }}
                      importerType={importerType}
                      onMappingChange={onMappingChange}
                      selectedProjectId={mapping.projectId}
                    />
                  </div>
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
                  <div className="flex items-center gap-1">
                    {onRefreshTags && mappings[project.id] && (
                      <Button
                        aria-label={t('issueImporters.actions.refreshTags', {
                          defaultValue: 'Refresh tags',
                        })}
                        fullWidth={false}
                        onClick={() =>
                          onRefreshTags(mappings[project.id]!.projectId)
                        }
                        size="sm"
                        title={t('issueImporters.actions.refreshTags', {
                          defaultValue: 'Refresh tags',
                        })}
                        variant="ghost"
                      >
                        <LucideIcon icon={RefreshCw} size={14} />
                      </Button>
                    )}
                    <ProjectMappingRowContext
                      existingTagConfig={mappings[project.id]?.tagConfig}
                      externalProject={project}
                      importerType={importerType}
                      onMappingChange={onMappingChange}
                      selectedProjectId={mappings[project.id]?.projectId}
                    />
                  </div>
                </DataListField>
              </DataListRow>
            ))}
          </DataList>
        </div>
      </div>
    </ContextMenuProvider>
  )
}
