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

import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { useToast } from '~/components/ui/feedback/use-toast'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius'
import {
  useDeleteConfig,
  useRefreshTags,
} from '~/services/api/lasius-hooks/issue-importers/issue-importers'

type ModalType =
  | 'configEdit'
  | 'configInfo'
  | 'deleteConfirm'
  | 'projectMappings'
  | 'wizard'
  | null

type UseIssueImporterConfigManagementReturn = {
  activeModal: ModalType
  closeModal: () => void
  handleDelete: () => void
  handleRefreshAllTags: (config: ModelsIssueImporterConfigResponse) => void
  isDeleting: boolean
  openConfigEdit: (config: ModelsIssueImporterConfigResponse) => void
  openConfigInfo: (config: ModelsIssueImporterConfigResponse) => void
  openDeleteConfirm: (config: ModelsIssueImporterConfigResponse) => void
  openProjectMappings: (config: ModelsIssueImporterConfigResponse) => void
  openWizard: () => void
  selectedConfig: ModelsIssueImporterConfigResponse | null
}

export function useIssueImporterConfigManagement(
  selectedOrgId: string,
): UseIssueImporterConfigManagementReturn {
  const { t } = useTranslation('integrations')
  const { addToast } = useToast()
  const revalidator = useRevalidator()

  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [selectedConfig, setSelectedConfig] =
    useState<ModelsIssueImporterConfigResponse | null>(null)

  const deleteApi = useDeleteConfig({
    onError: () => {
      addToast({
        message: t('issueImporters.errors.deleteFailed', {
          defaultValue: 'Failed to delete integration',
        }),
        type: 'ERROR',
      })
    },
    onSuccess: () => {
      setActiveModal(null)
      setSelectedConfig(null)
      void revalidator.revalidate()
      addToast({
        message: t('issueImporters.success.configDeleted', {
          defaultValue: 'Integration deleted successfully',
        }),
        type: 'SUCCESS',
      })
    },
  })

  const openWizard = useCallback(() => {
    setActiveModal('wizard')
    setSelectedConfig(null)
  }, [])

  const openConfigInfo = useCallback(
    (config: ModelsIssueImporterConfigResponse) => {
      setActiveModal('configInfo')
      setSelectedConfig(config)
    },
    [],
  )

  const openConfigEdit = useCallback(
    (config: ModelsIssueImporterConfigResponse) => {
      setActiveModal('configEdit')
      setSelectedConfig(config)
    },
    [],
  )

  const openProjectMappings = useCallback(
    (config: ModelsIssueImporterConfigResponse) => {
      setActiveModal('projectMappings')
      setSelectedConfig(config)
    },
    [],
  )

  const openDeleteConfirm = useCallback(
    (config: ModelsIssueImporterConfigResponse) => {
      setActiveModal('deleteConfirm')
      setSelectedConfig(config)
    },
    [],
  )

  const closeModal = useCallback(() => {
    setActiveModal(null)
    setSelectedConfig(null)
  }, [])

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

  const handleDelete = useCallback(() => {
    if (!selectedConfig) return
    deleteApi.submit({
      configId: selectedConfig.id,
      orgId: selectedOrgId,
    })
  }, [selectedConfig, selectedOrgId, deleteApi])

  const handleRefreshAllTags = useCallback(
    (config: ModelsIssueImporterConfigResponse) => {
      const projects =
        'projects' in config && Array.isArray(config.projects)
          ? config.projects
          : []

      for (const mapping of projects) {
        if (mapping.id) {
          refreshTagsApi.submit({
            configId: config.id,
            mappingId: mapping.id,
            orgId: selectedOrgId,
          })
        }
      }
    },
    [selectedOrgId, refreshTagsApi],
  )

  return {
    activeModal,
    closeModal,
    handleDelete,
    handleRefreshAllTags,
    isDeleting: deleteApi.isSubmitting,
    openConfigEdit,
    openConfigInfo,
    openDeleteConfirm,
    openProjectMappings,
    openWizard,
    selectedConfig,
  }
}
