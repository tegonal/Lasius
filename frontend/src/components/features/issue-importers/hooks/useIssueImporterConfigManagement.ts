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

import { useToast } from 'components/ui/feedback/hooks/useToast'
import { getGetConfigsKey, useGetConfigs } from 'lib/api/lasius/issue-importers/issue-importers'
import { lasiusAxiosInstance } from 'lib/api/lasiusAxiosInstance'
import { logger } from 'lib/logger'
import { useTranslation } from 'next-i18next'
import { useCallback, useMemo, useState } from 'react'
import { mutate } from 'swr'

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type { ModelsIssueImporterConfigResponse } from 'lib/api/lasius'

type PlatformModals = Record<ImporterType, boolean>
type EditingConfigs = Record<ImporterType, ModelsIssueImporterConfigResponse | undefined>

/**
 * Centralized hook for managing issue importer configurations
 * Consolidates all CRUD operations and modal state management
 *
 * @param orgId - Organization ID
 * @returns Config management state and actions
 */
export const useIssueImporterConfigManagement = (orgId: string) => {
  const { t } = useTranslation('integrations')
  const { addToast } = useToast()

  // Fetch all configs for all platforms
  const { data: githubConfigs, isLoading: loadingGithub } = useGetConfigs(orgId, {
    type: 'github' as any,
  })
  const { data: gitlabConfigs, isLoading: loadingGitlab } = useGetConfigs(orgId, {
    type: 'gitlab',
  })
  const { data: jiraConfigs, isLoading: loadingJira } = useGetConfigs(orgId, { type: 'jira' })
  const { data: planeConfigs, isLoading: loadingPlane } = useGetConfigs(orgId, { type: 'plane' })

  // Platform modal state
  const [platformModals, setPlatformModals] = useState<PlatformModals>({
    github: false,
    gitlab: false,
    jira: false,
    plane: false,
  })

  const [editingConfigs, setEditingConfigs] = useState<EditingConfigs>({
    github: undefined,
    gitlab: undefined,
    jira: undefined,
    plane: undefined,
  })

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    config: ModelsIssueImporterConfigResponse
    type: ImporterType
  } | null>(null)

  // Mappings modal state
  const [mappingsModal, setMappingsModal] = useState<{
    open: boolean
    config?: ModelsIssueImporterConfigResponse
  }>({ open: false })

  // Computed values
  const allConfigs = useMemo(
    () =>
      [
        ...(githubConfigs || []).map((c) => ({ ...c, type: 'github' as const })),
        ...(gitlabConfigs || []).map((c) => ({ ...c, type: 'gitlab' as const })),
        ...(jiraConfigs || []).map((c) => ({ ...c, type: 'jira' as const })),
        ...(planeConfigs || []).map((c) => ({ ...c, type: 'plane' as const })),
      ].sort((a, b) => a.name.localeCompare(b.name)),
    [githubConfigs, gitlabConfigs, jiraConfigs, planeConfigs],
  )

  const isLoading = loadingGithub || loadingGitlab || loadingJira || loadingPlane

  // Actions
  const openCreateModal = useCallback((type: ImporterType) => {
    setEditingConfigs((prev) => ({ ...prev, [type]: undefined }))
    setPlatformModals((prev) => ({ ...prev, [type]: true }))
  }, [])

  const openEditModal = useCallback((config: ModelsIssueImporterConfigResponse) => {
    const type = config.importerType as ImporterType
    setEditingConfigs((prev) => ({ ...prev, [type]: config }))
    setPlatformModals((prev) => ({ ...prev, [type]: true }))
  }, [])

  const closeModal = useCallback((type: ImporterType) => {
    setPlatformModals((prev) => ({ ...prev, [type]: false }))
    setEditingConfigs((prev) => ({ ...prev, [type]: undefined }))
  }, [])

  const openMappingsModal = useCallback((config: ModelsIssueImporterConfigResponse) => {
    setMappingsModal({ open: true, config })
  }, [])

  const closeMappingsModal = useCallback(() => {
    setMappingsModal({ open: false, config: undefined })
  }, [])

  const confirmDelete = useCallback((config: ModelsIssueImporterConfigResponse) => {
    setDeleteConfirm({ config, type: config.importerType as ImporterType })
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return

    const { config, type } = deleteConfirm

    try {
      await lasiusAxiosInstance({
        url: `/organisations/${orgId}/issue-importers/${config.id}`,
        method: 'DELETE',
      })

      await mutate(getGetConfigsKey(orgId, { type: type as any }))

      addToast({
        message: t('issueImporters.success.configDeleted', {
          defaultValue: 'Configuration deleted successfully',
        }),
        type: 'SUCCESS',
      })
    } catch (error) {
      logger.error(`[useIssueImporterConfigManagement] Failed to delete ${type} config:`, error)
      addToast({
        message: t(`issueImporters.errors.deleteFailed.${type}`, {
          defaultValue: `Failed to delete ${type} config`,
        }),
        type: 'ERROR',
      })
    } finally {
      setDeleteConfirm(null)
    }
  }, [deleteConfirm, orgId, addToast, t])

  const cancelDelete = useCallback(() => {
    setDeleteConfirm(null)
  }, [])

  return {
    // Data
    allConfigs,
    githubConfigs: githubConfigs || [],
    gitlabConfigs: gitlabConfigs || [],
    jiraConfigs: jiraConfigs || [],
    planeConfigs: planeConfigs || [],
    isLoading,

    // Platform modals
    platformModals,
    editingConfigs,
    openCreateModal,
    openEditModal,
    closeModal,

    // Delete
    deleteConfirm,
    confirmDelete,
    handleDelete,
    cancelDelete,

    // Mappings
    mappingsModal,
    openMappingsModal,
    closeMappingsModal,
  }
}
