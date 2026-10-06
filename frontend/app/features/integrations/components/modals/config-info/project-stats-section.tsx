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

import { FormatDate } from '~/components/ui/data-display/format-date'
import {
  InfoCard,
  InfoSection,
} from '~/features/integrations/components/modals/config-info/info-section'
import {
  buildMappingStatsGroups,
  type MappingStatEntry,
} from '~/features/integrations/lib/mapping-helpers'
import { useProjects } from '~/features/projects/hooks/use-projects'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius'

type ProjectStatsSectionProperties = {
  config: ModelsIssueImporterConfigResponse
}

const LastSyncCell = ({ entry }: { entry: MappingStatEntry }) => {
  const { t } = useTranslation('integrations')

  if (!entry.stat) {
    return (
      <span className="text-base-content/40 italic">
        {t('issueImporters.info.pendingFirstSync', { defaultValue: 'Pending first sync' })}
      </span>
    )
  }
  if (!entry.stat.lastSyncAt) {
    return <>{t('issueImporters.info.notAvailable', { defaultValue: 'N/A' })}</>
  }
  return <FormatDate date={entry.stat.lastSyncAt} format="fullDateLong" />
}

export const ProjectStatsSection = ({ config }: ProjectStatsSectionProperties) => {
  const { t } = useTranslation('integrations')
  const { findProjectById } = useProjects()

  const groups = buildMappingStatsGroups(
    config.importerType,
    config.projects,
    config.syncStatus.projectStats,
  )

  return (
    <InfoSection
      title={t('issueImporters.info.projectStats', { defaultValue: 'Project Statistics' })}>
      <div className="space-y-3">
        {Object.entries(groups).map(([externalName, entries]) => (
          <InfoCard key={externalName}>
            <p className="mb-2 text-sm font-medium">{externalName}</p>
            <table className="table-sm table">
              <thead>
                <tr>
                  <th>
                    {t('issueImporters.info.lasiusProject', { defaultValue: 'Lasius Project' })}
                  </th>
                  <th>{t('issueImporters.info.issuesSynced', { defaultValue: 'Issues' })}</th>
                  <th>{t('issueImporters.info.lastSync', { defaultValue: 'Last Sync' })}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.projectId}>
                    <td className="text-sm">
                      {findProjectById(entry.projectId)?.key ?? entry.projectId}
                    </td>
                    <td className="text-sm">
                      {entry.stat ? entry.stat.totalIssuesSynced || 0 : '—'}
                    </td>
                    <td className="text-base-content/70 text-sm">
                      <LastSyncCell entry={entry} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </InfoCard>
        ))}
      </div>
    </InfoSection>
  )
}
