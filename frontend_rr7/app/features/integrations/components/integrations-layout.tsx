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

import { useTranslation } from 'react-i18next'
import { useLoaderData } from 'react-router'

import {
  ColumnCenter,
  ColumnRight,
  innerGridClasses,
} from '~/components/ui/layouts/layout-columns'
import { GenericConfirmModal } from '~/components/ui/overlays/modal/generic-confirm-modal'
import { IntegrationsContent } from '~/features/integrations/components/integrations-content'
import { IntegrationsRightColumn } from '~/features/integrations/components/integrations-right-column'
import { IntegrationsStats } from '~/features/integrations/components/integrations-stats'
import { IssueImporterWizard } from '~/features/integrations/components/wizard/issue-importer-wizard'
import { useIssueImporterConfigManagement } from '~/features/integrations/hooks/use-issue-importer-config-management'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius/modelsIssueImporterConfigResponse'

export const IntegrationsLayout = () => {
  const { t } = useTranslation('integrations')

  const { configs, selectedOrgId } = useLoaderData<{
    configs: ModelsIssueImporterConfigResponse[]
    selectedOrgId: string
  }>()

  const management = useIssueImporterConfigManagement(selectedOrgId)

  const hasProjects =
    (management.selectedConfig &&
      'projects' in management.selectedConfig &&
      Array.isArray(management.selectedConfig.projects) &&
      management.selectedConfig.projects.length > 0) ??
    false

  return (
    <>
      <div className={innerGridClasses}>
        <ColumnCenter>
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-shrink-0">
              <IntegrationsStats
                configs={configs}
                onAddClick={management.openWizard}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <IntegrationsContent
                configs={configs}
                onDelete={management.openDeleteConfirm}
                onEdit={management.openConfigEdit}
                onViewInfo={management.openConfigInfo}
                onViewMappings={management.openProjectMappings}
              />
            </div>
          </div>
        </ColumnCenter>
        <ColumnRight>
          <IntegrationsRightColumn />
        </ColumnRight>
      </div>

      <GenericConfirmModal
        alert={
          hasProjects
            ? {
                message: t('integrations.delete.hasProjects', {
                  defaultValue:
                    'This configuration has project mappings. Remove all mappings before deleting.',
                }),
                variant: 'warning' as const,
              }
            : undefined
        }
        confirmLabel={t('integrations.delete.confirm', {
          defaultValue: 'Delete',
        })}
        confirmVariant="error"
        message={t('integrations.delete.message', {
          defaultValue:
            'Are you sure you want to delete this integration configuration?',
          name: management.selectedConfig?.name ?? '',
        })}
        onClose={management.closeModal}
        onConfirm={management.handleDelete}
        open={management.activeModal === 'deleteConfirm'}
        title={t('integrations.delete.title', {
          defaultValue: 'Delete Integration',
        })}
      />

      <IssueImporterWizard
        onClose={management.closeModal}
        open={management.activeModal === 'wizard'}
        selectedOrgId={selectedOrgId}
      />
    </>
  )
}
