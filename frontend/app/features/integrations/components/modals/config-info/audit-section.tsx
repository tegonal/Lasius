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
import { InfoRow } from '~/features/integrations/components/modals/config-info/info-row'
import {
  InfoCard,
  InfoSection,
} from '~/features/integrations/components/modals/config-info/info-section'
import { getUserDisplayName } from '~/features/integrations/lib/user-display-name'
import { type ModelsAuditInfoResponse } from '~/services/api/lasius'

type AuditSectionProperties = {
  audit: ModelsAuditInfoResponse
}

export const AuditSection = ({ audit }: AuditSectionProperties) => {
  const { t } = useTranslation('integrations')

  return (
    <InfoSection title={t('issueImporters.info.auditInfo', { defaultValue: 'Audit Information' })}>
      <InfoCard>
        <dl className="space-y-2">
          <InfoRow label={t('issueImporters.info.createdAt', { defaultValue: 'Created' })}>
            <FormatDate date={audit.createdAt} format="fullDateLong" />
          </InfoRow>
          <InfoRow label={t('issueImporters.info.createdBy', { defaultValue: 'Created By' })}>
            {getUserDisplayName(audit.createdBy)}
          </InfoRow>
          <InfoRow label={t('issueImporters.info.updatedAt', { defaultValue: 'Last Updated' })}>
            <FormatDate date={audit.updatedAt} format="fullDateLong" />
          </InfoRow>
          <InfoRow label={t('issueImporters.info.updatedBy', { defaultValue: 'Updated By' })}>
            {getUserDisplayName(audit.updatedBy)}
          </InfoRow>
        </dl>
      </InfoCard>
    </InfoSection>
  )
}
