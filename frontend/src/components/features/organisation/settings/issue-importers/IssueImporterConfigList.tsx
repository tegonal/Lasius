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
import { Button } from 'components/primitives/buttons/Button'
import { EmptyStateIssueImporters } from 'components/ui/data-display/fetchState/emptyStateIssueImporters'
import { Loading } from 'components/ui/data-display/fetchState/loading'
import { useToast } from 'components/ui/feedback/hooks/useToast'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { GenericConfirmModal } from 'components/ui/overlays/modal/GenericConfirmModal'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { Plus } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'

import { ConfigListItem } from './shared/ConfigListItem'
import { GenericConfigModal } from './shared/GenericConfigModal'
import { ProjectMappingsModal } from './shared/ProjectMappingsModal'
import { IssueImporterWizard } from './wizard/IssueImporterWizard'

export const IssueImporterConfigList: React.FC = () => {
  const { t } = useTranslation('integrations')
  const { addToast } = useToast()
  const { selectedOrganisationId } = useOrganisation()
  const orgId = selectedOrganisationId || ''

  const [showWizard, setShowWizard] = useState(false)

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

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-center justify-end">
        <Button variant="neutral" onClick={() => setShowWizard(true)}>
          <LucideIcon icon={Plus} size={16} className="mr-2" />
          {t('issueImporters.actions.addConfiguration', { defaultValue: 'Add Configuration' })}
        </Button>
      </div>

      <div className="space-y-4">
        {allConfigs.length === 0 ? (
          <EmptyStateIssueImporters />
        ) : (
          allConfigs.map((config) => (
            <ConfigListItem
              key={config.id}
              type={config.type}
              name={config.name}
              baseUrl={String(config.baseUrl)}
              projectCount={config.projects.length}
              createdBy={config.audit.createdBy}
              onEdit={() => openEditModal(config)}
              onDelete={() => confirmDelete(config)}
              onViewMappings={() => openMappingsModal(config)}
            />
          ))
        )}
      </div>

      {/* Wizard */}
      <IssueImporterWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        orgId={orgId}
        addToast={addToast}
      />

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
    </div>
  )
}
