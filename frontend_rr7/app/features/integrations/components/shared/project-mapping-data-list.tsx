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

import { AlertTriangle, ArrowRight, FolderOpen, Plus, X } from 'lucide-react'
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
import { Modal } from '~/components/ui/overlays/modal/modal'
import { ContextMenuProvider } from '~/features/context-menu/hooks/use-context-menu'
import { ProjectMappingRowContext } from '~/features/integrations/components/wizard/steps/project-mapping-row-context'
import { ProjectMappingSelector } from '~/features/integrations/components/wizard/steps/project-mapping-selector'
import { useProjectMappingList } from '~/features/integrations/hooks/use-project-mapping-list'
import { getImporterTypeLabel } from '~/features/integrations/lib/importer-type-labels'
import {
  type MappingsByExternalProject,
  type TagConfiguration,
} from '~/features/integrations/lib/mapping-helpers'
import { useProjects } from '~/features/projects/hooks/use-projects'
import { untyped } from '~/lib/i18n-types'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import { type ModelsExternalProject } from '~/services/api/lasius'

type ProjectMappingDataListProps = {
  importerType: ImporterType
  isError: boolean
  isLoading: boolean
  mappings: MappingsByExternalProject
  onMappingRemove: (extId: string, projectId: string) => void
  onMappingUpsert: (
    extId: string,
    projectId: string,
    tagConfig?: TagConfiguration,
  ) => void
  onRefreshTags?: (mappingId: string) => void
  projects: ModelsExternalProject[]
}

export const ProjectMappingDataList = ({
  importerType,
  isError,
  isLoading,
  mappings,
  onMappingRemove,
  onMappingUpsert,
  onRefreshTags,
  projects,
}: ProjectMappingDataListProps) => {
  const { t } = useTranslation('integrations')
  const { userProjects } = useProjects()
  const [filterText, setFilterText] = useState('')
  const [addSelectorProject, setAddSelectorProject] =
    useState<ModelsExternalProject | null>(null)

  const { mappedCount, orphanedMappings, showFilter, sortedProjects } =
    useProjectMappingList({ filterText, mappings, projects })

  const getMappedProjectIdsForExternal = (externalProjectId: string) =>
    (mappings[externalProjectId] ?? []).map((m) => m.projectId)

  const lasiusProjects = userProjects.map((p) => ({
    id: p.projectReference.id,
    key: p.projectReference.key,
  }))

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
            {orphanedMappings.map(
              ({ externalId, mappings: orphanMappings }) => (
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
                    <div className="flex flex-wrap items-center gap-1.5">
                      {orphanMappings.map((mapping) => (
                        <ProjectMappingRowContext
                          excludeProjectIds={getMappedProjectIdsForExternal(
                            externalId,
                          )}
                          externalProject={{
                            id: externalId,
                            name: externalId,
                            ownerType: 'User',
                          }}
                          importerType={importerType}
                          key={`${mapping.projectId}-${mapping.id?.value ?? 'new'}`}
                          lasiusProjects={lasiusProjects}
                          mapping={mapping}
                          onMappingRemove={onMappingRemove}
                          onMappingUpsert={onMappingUpsert}
                          onRefreshTags={onRefreshTags}
                        />
                      ))}
                    </div>
                  </DataListField>
                  <DataListField />
                </DataListRow>
              ),
            )}
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
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(mappings[project.id] ?? []).map((mapping) => (
                      <ProjectMappingRowContext
                        excludeProjectIds={getMappedProjectIdsForExternal(
                          project.id,
                        )}
                        externalProject={project}
                        importerType={importerType}
                        key={`${mapping.projectId}-${mapping.id?.value ?? 'new'}`}
                        lasiusProjects={lasiusProjects}
                        mapping={mapping}
                        onMappingRemove={onMappingRemove}
                        onMappingUpsert={onMappingUpsert}
                        onRefreshTags={onRefreshTags}
                      />
                    ))}
                    {(mappings[project.id] ?? []).length === 0 && (
                      <span className="text-base-content/50 text-sm">
                        {t('issueImporters.wizard.projects.notMapped', {
                          defaultValue: 'Not mapped',
                        })}
                      </span>
                    )}
                  </div>
                </DataListField>
                <DataListField>
                  <Button
                    aria-label={t('issueImporters.wizard.projects.addMapping', {
                      defaultValue: 'Add mapping',
                    })}
                    fullWidth={false}
                    onClick={() => setAddSelectorProject(project)}
                    shape="circle"
                    variant="contextIcon"
                  >
                    <LucideIcon icon={Plus} size={20} />
                  </Button>
                </DataListField>
              </DataListRow>
            ))}
          </DataList>
        </div>
      </div>

      {addSelectorProject && (
        <Modal
          onClose={() => setAddSelectorProject(null)}
          open={!!addSelectorProject}
          size="lg"
        >
          <ProjectMappingSelector
            excludeProjectIds={getMappedProjectIdsForExternal(
              addSelectorProject.id,
            )}
            externalProject={addSelectorProject}
            importerType={importerType}
            lasiusProjects={lasiusProjects}
            onCancel={() => setAddSelectorProject(null)}
            onSelect={(projectId, tagConfig) => {
              if (projectId) {
                onMappingUpsert(addSelectorProject.id, projectId, tagConfig)
              }
              setAddSelectorProject(null)
            }}
          />
        </Modal>
      )}
    </ContextMenuProvider>
  )
}
