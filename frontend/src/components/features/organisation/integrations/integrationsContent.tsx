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

import { useIssueImporterConfigManagement } from 'components/features/issue-importers/hooks/useIssueImporterConfigManagement'
import { HealthIndicator } from 'components/features/issue-importers/shared/HealthIndicator'
import { ImporterTypeBadge } from 'components/features/issue-importers/shared/ImporterTypeBadge'
import { DataList } from 'components/ui/data-display/dataList/dataList'
import { DataListField } from 'components/ui/data-display/dataList/dataListField'
import { DataListHeaderItem } from 'components/ui/data-display/dataList/dataListHeaderItem'
import { DataListRow } from 'components/ui/data-display/dataList/dataListRow'
import { EmptyStateIssueImporters } from 'components/ui/data-display/fetchState/emptyStateIssueImporters'
import { Loading } from 'components/ui/data-display/fetchState/loading'
import { GenericConfirmModal } from 'components/ui/overlays/modal/GenericConfirmModal'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'

import { ConfigInfoModal } from '../settings/issue-importers/shared/ConfigInfoModal'
import { GenericConfigModal } from '../settings/issue-importers/shared/GenericConfigModal'
import { ProjectMappingsModal } from '../settings/issue-importers/shared/ProjectMappingsModal'
import { IntegrationConfigItemContext } from './IntegrationConfigItemContext'

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type { ModelsIssueImporterConfigId, ModelsIssueImporterConfigResponse } from 'lib/api/lasius'

export const IntegrationsContent: React.FC = () => {
  const { t } = useTranslation('integrations')
  const { selectedOrganisationId } = useOrganisation()
  const orgId = selectedOrganisationId || ''

  // Use centralized config management hook
  const {
    allConfigs,
    isLoading,
    platformModals,
    editingConfigs,
    openEditModal,
    closeModal,
    deleteConfirm,
    confirmDelete,
    handleDelete,
    cancelDelete,
    mappingsModal,
    openMappingsModal,
    closeMappingsModal,
  } = useIssueImporterConfigManagement(orgId)

  // Info modal state
  const [infoModal, setInfoModal] = useState<{
    open: boolean
    configId: ModelsIssueImporterConfigId | null
    importerType: ImporterType | null
  }>({
    open: false,
    configId: null,
    importerType: null,
  })

  const openInfoModal = (config: ModelsIssueImporterConfigResponse) => {
    setInfoModal({
      open: true,
      configId: config.id,
      importerType: config.type as ImporterType,
    })
  }

  const closeInfoModal = () => {
    setInfoModal({
      open: false,
      configId: null,
      importerType: null,
    })
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="pt-4">
      {allConfigs.length === 0 ? (
        <EmptyStateIssueImporters />
      ) : (
        <DataList>
          <DataListRow>
            <DataListHeaderItem>
              {t('issueImporters.headers.type', { defaultValue: 'Type' })}
            </DataListHeaderItem>
            <DataListHeaderItem>
              {t('issueImporters.headers.name', { defaultValue: 'Name' })}
            </DataListHeaderItem>
            <DataListHeaderItem>
              {t('issueImporters.headers.baseUrl', { defaultValue: 'Base URL' })}
            </DataListHeaderItem>
            <DataListHeaderItem>
              {t('issueImporters.headers.projects', { defaultValue: 'Projects' })}
            </DataListHeaderItem>
            <DataListHeaderItem />
          </DataListRow>
          {allConfigs.map((config) => {
            const projectCount = config.projects.length

            return (
              <DataListRow key={config.id}>
                <DataListField>
                  <div className="flex items-center gap-2">
                    <ImporterTypeBadge type={config.type} />
                    {config.syncStatus?.connectivityStatus && (
                      <HealthIndicator status={config.syncStatus.connectivityStatus} />
                    )}
                  </div>
                </DataListField>
                <DataListField>
                  <span className="font-medium">{config.name}</span>
                </DataListField>
                <DataListField>
                  <span className="text-base-content/70 text-sm">{String(config.baseUrl)}</span>
                </DataListField>
                <DataListField>
                  <span className="text-base-content/60 text-xs">
                    {t('issueImporters.configListItem.projectCount', {
                      count: projectCount,
                      defaultValue_one: '{{count}} project',
                      defaultValue_other: '{{count}} projects',
                    })}
                  </span>
                </DataListField>
                <DataListField>
                  <IntegrationConfigItemContext
                    configId={config.id}
                    projectCount={projectCount}
                    onEdit={() => openEditModal(config)}
                    onViewMappings={() => openMappingsModal(config)}
                    onViewInfo={() => openInfoModal(config)}
                    onDelete={() => confirmDelete(config)}
                  />
                </DataListField>
              </DataListRow>
            )
          })}
        </DataList>
      )}

      {/* Generic modals for each platform */}
      <GenericConfigModal
        open={platformModals.github}
        onClose={() => closeModal('github')}
        importerType="github"
        config={editingConfigs.github}
        orgId={orgId}
      />
      <GenericConfigModal
        open={platformModals.gitlab}
        onClose={() => closeModal('gitlab')}
        importerType="gitlab"
        config={editingConfigs.gitlab}
        orgId={orgId}
      />
      <GenericConfigModal
        open={platformModals.jira}
        onClose={() => closeModal('jira')}
        importerType="jira"
        config={editingConfigs.jira}
        orgId={orgId}
      />
      <GenericConfigModal
        open={platformModals.plane}
        onClose={() => closeModal('plane')}
        importerType="plane"
        config={editingConfigs.plane}
        orgId={orgId}
      />

      {/* Delete confirmation */}
      <GenericConfirmModal
        open={!!deleteConfirm}
        onClose={cancelDelete}
        onConfirm={handleDelete}
        message={t(`issueImporters.confirmDelete.${deleteConfirm?.type}`, {
          defaultValue: 'Are you sure you want to delete this configuration?',
        })}
        confirmLabel={t('issueImporters.actions.delete', { defaultValue: 'Delete configuration' })}
        cancelLabel={t('actions.cancel', { defaultValue: 'Cancel' })}
        confirmVariant="error"
      />

      {/* Project mappings modal */}
      {mappingsModal.config && (
        <ProjectMappingsModal
          open={mappingsModal.open}
          onClose={closeMappingsModal}
          config={mappingsModal.config}
          orgId={orgId}
        />
      )}

      {/* Config info modal */}
      {infoModal.configId && infoModal.importerType && (
        <ConfigInfoModal
          open={infoModal.open}
          onClose={closeInfoModal}
          configId={infoModal.configId}
          orgId={orgId}
          importerType={infoModal.importerType}
        />
      )}
    </div>
  )
}
