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
import { Alert } from '~/components/ui/feedback/alert'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { InfoRow } from '~/features/integrations/components/modals/config-info/info-row'
import {
  InfoCard,
  InfoSection,
} from '~/features/integrations/components/modals/config-info/info-section'
import {
  getConnectivityStatusLabel,
  getConnectivityStatusStyle,
} from '~/features/integrations/lib/connectivity-status'
import { untyped } from '~/lib/i18n-types'
import { type ModelsConfigSyncStatus } from '~/services/api/lasius'

type HealthSectionProperties = {
  syncStatus: ModelsConfigSyncStatus
}

export const HealthSection = ({ syncStatus }: HealthSectionProperties) => {
  const { t } = useTranslation('integrations')
  const { connectivityStatus, currentIssue } = syncStatus
  const { icon, iconClassName } = getConnectivityStatusStyle(connectivityStatus)

  return (
    <InfoSection title={t('issueImporters.info.healthStatus', { defaultValue: 'Health Status' })}>
      <InfoCard>
        <div className="mb-4 flex items-center gap-3">
          <LucideIcon className={iconClassName} icon={icon} size={24} />
          <div>
            <p className="font-medium">
              {getConnectivityStatusLabel(connectivityStatus, untyped(t))}
            </p>
            {syncStatus.lastConnectivityCheck && (
              <p className="text-base-content/60 text-xs">
                {t('issueImporters.info.lastChecked', { defaultValue: 'Last checked:' })}{' '}
                <FormatDate date={syncStatus.lastConnectivityCheck} format="fullDateLong" />
              </p>
            )}
          </div>
        </div>

        {currentIssue && (
          <Alert className="mt-3" variant="warning">
            <div>
              <p className="text-sm font-medium">
                {currentIssue.errorCode ||
                  t('issueImporters.info.issueDetected', { defaultValue: 'Issue detected' })}
              </p>
              {currentIssue.message && <p className="mt-1 text-xs">{currentIssue.message}</p>}
              {currentIssue.httpStatus && (
                <p className="mt-1 text-xs">HTTP {currentIssue.httpStatus}</p>
              )}
            </div>
          </Alert>
        )}

        <dl className="mt-4 space-y-2">
          <InfoRow
            label={t('issueImporters.info.totalProjectsMapped', {
              defaultValue: 'Projects Mapped',
            })}>
            {syncStatus.totalProjectsMapped}
          </InfoRow>
          <InfoRow
            label={t('issueImporters.info.totalIssuesSynced', {
              defaultValue: 'Total Issues Synced',
            })}>
            {syncStatus.totalIssuesSynced}
          </InfoRow>
          {syncStatus.lastSuccessfulSync && (
            <InfoRow
              label={t('issueImporters.info.lastSuccessfulSync', {
                defaultValue: 'Last Successful Sync',
              })}>
              <FormatDate date={syncStatus.lastSuccessfulSync} format="fullDateLong" />
            </InfoRow>
          )}
          {syncStatus.nextScheduledSync && (
            <InfoRow
              label={t('issueImporters.info.nextScheduledSync', {
                defaultValue: 'Next Scheduled Sync',
              })}>
              <FormatDate date={syncStatus.nextScheduledSync} format="fullDateLong" />
            </InfoRow>
          )}
        </dl>
      </InfoCard>
    </InfoSection>
  )
}
