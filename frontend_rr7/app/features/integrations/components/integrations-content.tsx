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

import { Plug } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DataList } from '~/components/ui/data-display/data-list/data-list'
import { DataListHeaderItem } from '~/components/ui/data-display/data-list/data-list-header-item'
import { DataListRow } from '~/components/ui/data-display/data-list/data-list-row'
import { EmptyState } from '~/components/ui/data-display/empty-state'
import { ContextMenuProvider } from '~/features/context-menu/hooks/use-context-menu'
import { IntegrationConfigItem } from '~/features/integrations/components/integration-config-item'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius'

type Props = {
  configs: ModelsIssueImporterConfigResponse[]
  onDelete: (config: ModelsIssueImporterConfigResponse) => void
  onEdit: (config: ModelsIssueImporterConfigResponse) => void
  onViewInfo: (config: ModelsIssueImporterConfigResponse) => void
  onViewMappings: (config: ModelsIssueImporterConfigResponse) => void
}

export const IntegrationsContent = ({
  configs,
  onDelete,
  onEdit,
  onViewInfo,
  onViewMappings,
}: Props) => {
  const { t } = useTranslation('integrations')

  if (configs.length === 0) {
    return (
      <EmptyState
        icon={Plug}
        label={t('issueImporters.emptyState', {
          defaultValue:
            'No integrations configured yet. Add one to get started.',
        })}
      />
    )
  }

  return (
    <ContextMenuProvider>
      <div className="pt-4">
        <DataList>
          <DataListRow>
            <DataListHeaderItem>
              {t('issueImporters.headers.type', { defaultValue: 'Type' })}
            </DataListHeaderItem>
            <DataListHeaderItem>
              {t('issueImporters.headers.name', { defaultValue: 'Name' })}
            </DataListHeaderItem>
            <DataListHeaderItem>
              {t('issueImporters.headers.baseUrl', {
                defaultValue: 'Base URL',
              })}
            </DataListHeaderItem>
            <DataListHeaderItem>
              {t('issueImporters.headers.projects', {
                defaultValue: 'Projects',
              })}
            </DataListHeaderItem>
            <DataListHeaderItem />
          </DataListRow>
          {configs.map((config) => (
            <IntegrationConfigItem
              config={config}
              key={config.id}
              onDelete={onDelete}
              onEdit={onEdit}
              onViewInfo={onViewInfo}
              onViewMappings={onViewMappings}
            />
          ))}
        </DataList>
      </div>
    </ContextMenuProvider>
  )
}
