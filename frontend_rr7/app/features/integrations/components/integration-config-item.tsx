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

import { DataListField } from '~/components/ui/data-display/data-list/data-list-field'
import { DataListRow } from '~/components/ui/data-display/data-list/data-list-row'
import { HealthIndicator } from '~/features/integrations/components/health-indicator'
import { ImporterTypeBadge } from '~/features/integrations/components/importer-type-badge'
import { IntegrationConfigItemContext } from '~/features/integrations/components/integration-config-item-context'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius'

type Props = {
  config: ModelsIssueImporterConfigResponse
  onDelete: (config: ModelsIssueImporterConfigResponse) => void
  onEdit: (config: ModelsIssueImporterConfigResponse) => void
  onRefreshAllTags: (config: ModelsIssueImporterConfigResponse) => void
  onViewInfo: (config: ModelsIssueImporterConfigResponse) => void
  onViewMappings: (config: ModelsIssueImporterConfigResponse) => void
}

export const IntegrationConfigItem = ({
  config,
  onDelete,
  onEdit,
  onRefreshAllTags,
  onViewInfo,
  onViewMappings,
}: Props) => {
  const { t } = useTranslation('integrations')
  const projectCount =
    'projects' in config && Array.isArray(config.projects)
      ? config.projects.length
      : 0

  return (
    <DataListRow>
      <DataListField>
        <div className="flex items-center gap-2">
          <ImporterTypeBadge type={config.importerType as ImporterType} />
          {config.syncStatus?.connectivityStatus && (
            <HealthIndicator status={config.syncStatus.connectivityStatus} />
          )}
        </div>
      </DataListField>
      <DataListField>
        <span className="font-medium">{config.name}</span>
      </DataListField>
      <DataListField>
        <span className="text-base-content/70 text-sm">
          {String(config.baseUrl)}
        </span>
      </DataListField>
      <DataListField>
        <span className="text-base-content/60 text-xs">
          {t('issueImporters.configListItem.projectCount', {
            count: projectCount,
            defaultValue: '{{count}} mappings',
            defaultValue_one: '{{count}} mapping',
            defaultValue_other: '{{count}} mappings',
          })}
        </span>
      </DataListField>
      <DataListField>
        <IntegrationConfigItemContext
          configId={config.id}
          onDelete={() => onDelete(config)}
          onEdit={() => onEdit(config)}
          onRefreshAllTags={() => onRefreshAllTags(config)}
          onViewInfo={() => onViewInfo(config)}
          onViewMappings={() => onViewMappings(config)}
          projectCount={projectCount}
        />
      </DataListField>
    </DataListRow>
  )
}
