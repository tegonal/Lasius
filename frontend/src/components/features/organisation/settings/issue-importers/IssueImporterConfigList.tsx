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

import { Button } from 'components/primitives/buttons/Button'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import {
  useDeleteGitlabConfig,
  useDeleteJiraConfig,
  useDeletePlaneConfig,
  useGetGitlabConfigs,
  useGetJiraConfigs,
  useGetPlaneConfigs,
} from 'lib/api/lasius/issue-importers/issue-importers'
import { Blocks, Plus } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'
import { mutate } from 'swr'

import { GitlabConfigModal } from './gitlab/GitlabConfigModal'
import { JiraConfigModal } from './jira/JiraConfigModal'
import { PlaneConfigModal } from './plane/PlaneConfigModal'
import { ConfigListItem } from './shared/ConfigListItem'
import { ImporterTypeSelector } from './shared/ImporterTypeSelector'

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type {
  ModelsGitlabConfigResponse,
  ModelsJiraConfigResponse,
  ModelsPlaneConfigResponse,
} from 'lib/api/lasius'

export const IssueImporterConfigList: React.FC = () => {
  const { t } = useTranslation('common')
  const { selectedOrganisationId } = useOrganisation()
  const orgId = selectedOrganisationId || ''

  const { data: gitlabConfigs, isLoading: loadingGitlab } = useGetGitlabConfigs(orgId)
  const { data: jiraConfigs, isLoading: loadingJira } = useGetJiraConfigs(orgId)
  const { data: planeConfigs, isLoading: loadingPlane } = useGetPlaneConfigs(orgId)

  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [showGitlabModal, setShowGitlabModal] = useState(false)
  const [showJiraModal, setShowJiraModal] = useState(false)
  const [showPlaneModal, setShowPlaneModal] = useState(false)

  const [editingGitlabConfig, setEditingGitlabConfig] = useState<
    ModelsGitlabConfigResponse | undefined
  >()
  const [editingJiraConfig, setEditingJiraConfig] = useState<ModelsJiraConfigResponse | undefined>()
  const [editingPlaneConfig, setEditingPlaneConfig] = useState<
    ModelsPlaneConfigResponse | undefined
  >()

  const { trigger: deleteGitlabConfig } = useDeleteGitlabConfig(
    orgId,
    editingGitlabConfig?.id || { value: '' },
  )
  const { trigger: deleteJiraConfig } = useDeleteJiraConfig(
    orgId,
    editingJiraConfig?.id || { value: '' },
  )
  const { trigger: deletePlaneConfig } = useDeletePlaneConfig(
    orgId,
    editingPlaneConfig?.id || { value: '' },
  )

  const isLoading = loadingGitlab || loadingJira || loadingPlane

  const handleSelectType = (type: ImporterType) => {
    switch (type) {
      case 'gitlab':
        setShowGitlabModal(true)
        break
      case 'jira':
        setShowJiraModal(true)
        break
      case 'plane':
        setShowPlaneModal(true)
        break
    }
  }

  const handleEditGitlab = (config: ModelsGitlabConfigResponse) => {
    setEditingGitlabConfig(config)
    setShowGitlabModal(true)
  }

  const handleEditJira = (config: ModelsJiraConfigResponse) => {
    setEditingJiraConfig(config)
    setShowJiraModal(true)
  }

  const handleEditPlane = (config: ModelsPlaneConfigResponse) => {
    setEditingPlaneConfig(config)
    setShowPlaneModal(true)
  }

  const handleDeleteGitlab = async (config: ModelsGitlabConfigResponse) => {
    if (
      confirm(
        t('issueImporters.confirmDelete.gitlab', {
          defaultValue: 'Are you sure you want to delete this GitLab configuration?',
        }),
      )
    ) {
      try {
        setEditingGitlabConfig(config)
        await deleteGitlabConfig()
        await mutate(`/organisations/${orgId}/issue-importers/gitlab`)
      } catch (error) {
        console.error(
          t('issueImporters.errors.deleteFailed.gitlab', {
            defaultValue: 'Failed to delete GitLab config',
          }),
          error,
        )
      } finally {
        setEditingGitlabConfig(undefined)
      }
    }
  }

  const handleDeleteJira = async (config: ModelsJiraConfigResponse) => {
    if (
      confirm(
        t('issueImporters.confirmDelete.jira', {
          defaultValue: 'Are you sure you want to delete this Jira configuration?',
        }),
      )
    ) {
      try {
        setEditingJiraConfig(config)
        await deleteJiraConfig()
        await mutate(`/organisations/${orgId}/issue-importers/jira`)
      } catch (error) {
        console.error(
          t('issueImporters.errors.deleteFailed.jira', {
            defaultValue: 'Failed to delete Jira config',
          }),
          error,
        )
      } finally {
        setEditingJiraConfig(undefined)
      }
    }
  }

  const handleDeletePlane = async (config: ModelsPlaneConfigResponse) => {
    if (
      confirm(
        t('issueImporters.confirmDelete.plane', {
          defaultValue: 'Are you sure you want to delete this Plane configuration?',
        }),
      )
    ) {
      try {
        setEditingPlaneConfig(config)
        await deletePlaneConfig()
        await mutate(`/organisations/${orgId}/issue-importers/plane`)
      } catch (error) {
        console.error(
          t('issueImporters.errors.deleteFailed.plane', {
            defaultValue: 'Failed to delete Plane config',
          }),
          error,
        )
      } finally {
        setEditingPlaneConfig(undefined)
      }
    }
  }

  const handleCloseGitlabModal = () => {
    setShowGitlabModal(false)
    setEditingGitlabConfig(undefined)
  }

  const handleCloseJiraModal = () => {
    setShowJiraModal(false)
    setEditingJiraConfig(undefined)
  }

  const handleClosePlaneModal = () => {
    setShowPlaneModal(false)
    setEditingPlaneConfig(undefined)
  }

  if (isLoading) {
    return <div className="loading loading-spinner loading-lg"></div>
  }

  const hasConfigs =
    (gitlabConfigs?.length || 0) + (jiraConfigs?.length || 0) + (planeConfigs?.length || 0) > 0

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-center justify-end">
        <Button variant="primary" onClick={() => setShowTypeSelector(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('issueImporters.actions.addConfiguration', { defaultValue: 'Add Configuration' })}
        </Button>
      </div>

      <div className="space-y-4">
        {/* GitLab Configs */}
        {gitlabConfigs?.map((config) => (
          <ConfigListItem
            key={String(config.id.value)}
            type="gitlab"
            name={config.name}
            baseUrl={String(config.baseUrl)}
            projectCount={config.projects.length}
            onEdit={() => handleEditGitlab(config)}
            onDelete={() => handleDeleteGitlab(config)}
          />
        ))}

        {/* Jira Configs */}
        {jiraConfigs?.map((config) => (
          <ConfigListItem
            key={String(config.id.value)}
            type="jira"
            name={config.name}
            baseUrl={String(config.baseUrl)}
            projectCount={config.projects.length}
            onEdit={() => handleEditJira(config)}
            onDelete={() => handleDeleteJira(config)}
          />
        ))}

        {/* Plane Configs */}
        {planeConfigs?.map((config) => (
          <ConfigListItem
            key={String(config.id.value)}
            type="plane"
            name={config.name}
            baseUrl={String(config.baseUrl)}
            projectCount={config.projects.length}
            onEdit={() => handleEditPlane(config)}
            onDelete={() => handleDeletePlane(config)}
          />
        ))}

        {!hasConfigs && (
          <div className="flex h-full w-full flex-col items-center justify-center py-12">
            <div className="text-base-content/50 flex flex-col items-center justify-center gap-2 text-sm">
              <LucideIcon icon={Blocks} size={32} />
              <div className="text-center">
                {t('issueImporters.emptyState.message', {
                  defaultValue: 'No issue tracker configurations yet',
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <ImporterTypeSelector
        open={showTypeSelector}
        onClose={() => setShowTypeSelector(false)}
        onSelect={handleSelectType}
      />
      <GitlabConfigModal
        open={showGitlabModal}
        onClose={handleCloseGitlabModal}
        config={editingGitlabConfig}
        orgId={orgId}
      />
      <JiraConfigModal
        open={showJiraModal}
        onClose={handleCloseJiraModal}
        config={editingJiraConfig}
        orgId={orgId}
      />
      <PlaneConfigModal
        open={showPlaneModal}
        onClose={handleClosePlaneModal}
        config={editingPlaneConfig}
        orgId={orgId}
      />
    </div>
  )
}
