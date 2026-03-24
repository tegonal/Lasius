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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Text } from '~/components/primitives/typography/text'
import { DataList } from '~/components/ui/data-display/data-list/data-list'
import { DataListField } from '~/components/ui/data-display/data-list/data-list-field'
import { DataListHeaderItem } from '~/components/ui/data-display/data-list/data-list-header-item'
import { DataListRow } from '~/components/ui/data-display/data-list/data-list-row'
import { Loading } from '~/components/ui/data-display/loading'
import { Alert } from '~/components/ui/feedback/alert'
import { useToast } from '~/components/ui/feedback/use-toast'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { ProjectMappingRowContext } from '~/features/integrations/components/wizard/steps/project-mapping-row-context'
import { getImporterTypeLabel } from '~/features/integrations/lib/importer-type-labels'
import {
  buildMappingPayload,
  extractExternalProjectId,
  type TagConfiguration,
} from '~/features/integrations/lib/mapping-helpers'
import { logger } from '~/lib/logger'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import {
  type ModelsExternalProject,
  type ModelsIssueImporterConfigId,
  type ModelsIssueImporterConfigResponse,
  type ModelsListProjectsResponse,
} from '~/services/api/lasius'
import {
  useAddProjectMapping,
  useListProjects,
  useRefreshTags,
  useRemoveProjectMapping,
} from '~/services/api/lasius-hooks/issue-importers/issue-importers'

type MappingWithTagConfig = {
  projectId: string
  tagConfig?: TagConfiguration
}

type Props = {
  config: ModelsIssueImporterConfigResponse | null
  onClose: () => void
  open: boolean
  selectedOrgId: string
}

export const ProjectMappingsModal = ({
  config,
  onClose,
  open,
  selectedOrgId,
}: Props) => {
  const { t } = useTranslation('integrations')
  const { addToast } = useToast()
  const revalidator = useRevalidator()
  const [mappings, setMappings] = useState<
    Record<string, MappingWithTagConfig>
  >({})
  const [filterText, setFilterText] = useState('')

  const importerType = (config?.importerType as ImporterType) || 'github'
  const configId = (config?.id as ModelsIssueImporterConfigId) || ''

  // Fetch external projects
  const [projects, setProjects] = useState<ModelsExternalProject[]>([])
  const [fetchError, setFetchError] = useState<null | string>(null)
  const hasFetchedRef = useRef(false)

  const listProjectsApi = useListProjects({
    onError: () => {
      setFetchError('Failed to load projects')
    },
    onSuccess: (response: ModelsListProjectsResponse) => {
      setProjects(response?.projects ?? [])
      setFetchError(null)
    },
  })

  const addMappingApi = useAddProjectMapping({
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

  const removeMappingApi = useRemoveProjectMapping({
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

  // Build initial mappings from config.projects
  useEffect(() => {
    if (config?.projects) {
      const initialMappings: Record<string, MappingWithTagConfig> = {}

      ;(config.projects as any[]).forEach((mapping: any) => {
        const externalId = extractExternalProjectId(importerType, mapping)
        const existingTagConfig = mapping?.settings?.tagConfiguration

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

  // Clean up state when modal closes
  useEffect(() => {
    if (!open) {
      setMappings({})
      setProjects([])
      setFilterText('')
      hasFetchedRef.current = false
    }
  }, [open])

  // Fetch external projects when modal opens
  useEffect(() => {
    if (!open || !configId || hasFetchedRef.current) return

    hasFetchedRef.current = true
    listProjectsApi.submit({ configId, orgId: selectedOrgId })
  }, [open, configId, selectedOrgId, listProjectsApi])

  const handleMappingChange = useCallback(
    (
      externalProjectId: string,
      lasiusProjectId: null | string,
      tagConfig: TagConfiguration | undefined,
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

      // Remove mapping
      if (!lasiusProjectId) {
        if (!previousMapping) return

        removeMappingApi.submit({
          configId,
          orgId: selectedOrgId,
          projectId: previousMapping.projectId,
        })
        return
      }

      // Add/update mapping
      const externalProject = projects.find((p) => p.id === externalProjectId)

      const result = buildMappingPayload(
        importerType,
        externalProjectId,
        lasiusProjectId,
        tagConfig,
        externalProject?.name,
      )

      if (!result.success) {
        logger.error(
          '[ProjectMappingsModal] Mapping payload build failed:',
          result.error,
        )
        addToast({
          message: t('issueImporters.errors.invalidMappingData', {
            defaultValue: result.error,
          }),
          type: 'ERROR',
        })
        return
      }

      addMappingApi.submit({
        body: result.payload,
        configId,
        orgId: selectedOrgId,
      })
    },
    [
      mappings,
      configId,
      selectedOrgId,
      importerType,
      projects,
      addMappingApi,
      removeMappingApi,
      addToast,
      t,
    ],
  )

  const handleRefreshTags = useCallback(
    (projectId: string) => {
      refreshTagsApi.submit({
        configId,
        orgId: selectedOrgId,
        projectId,
      })
    },
    [configId, selectedOrgId, refreshTagsApi],
  )

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (!filterText.trim()) return projects

    const searchLower = filterText.toLowerCase()
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchLower) ||
        project.id.toLowerCase().includes(searchLower),
    )
  }, [projects, filterText])

  // Detect orphaned mappings
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

  // Sort projects: mapped first
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

  const renderContent = () => {
    if (listProjectsApi.isLoading) {
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

    if (listProjectsApi.isError || fetchError) {
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

    if (projects.length === 0 && !listProjectsApi.isLoading) {
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
        <Text className="mt-2" variant="infoText">
          {t('issueImporters.wizard.projects.mappingDescription', {
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
                  <div className="flex items-center gap-1">
                    <Button
                      aria-label={t('issueImporters.actions.refreshTags', {
                        defaultValue: 'Refresh tags',
                      })}
                      fullWidth={false}
                      onClick={() => handleRefreshTags(mapping.projectId)}
                      size="sm"
                      title={t('issueImporters.actions.refreshTags', {
                        defaultValue: 'Refresh tags',
                      })}
                      variant="ghost"
                    >
                      <LucideIcon icon={RefreshCw} size={14} />
                    </Button>
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
                    {mappings[project.id] && (
                      <Button
                        aria-label={t('issueImporters.actions.refreshTags', {
                          defaultValue: 'Refresh tags',
                        })}
                        fullWidth={false}
                        onClick={() =>
                          handleRefreshTags(mappings[project.id]!.projectId)
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
                      onMappingChange={handleMappingChange}
                      selectedProjectId={mappings[project.id]?.projectId}
                    />
                  </div>
                </DataListField>
              </DataListRow>
            ))}
          </DataList>
        </div>
      </div>
    )
  }

  return (
    <Modal onClose={onClose} open={open} size="lg">
      <div className="flex h-full flex-1 flex-col">
        <ModalCloseButton onClose={onClose} />

        <ModalHeader className="mb-4">
          {t('issueImporters.projectMappings.title', {
            defaultValue: '{{platform}} Project Mappings',
            platform: getImporterTypeLabel(importerType, t),
          })}
        </ModalHeader>

        {renderContent()}

        <div className="mt-6 min-h-0">
          <Button
            className="w-full"
            onClick={onClose}
            type="button"
            variant="secondary"
          >
            {t('actions.close', { defaultValue: 'Close' })}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
