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
import { StatsGroup } from 'components/ui/data-display/StatsGroup'
import { StatsTileNumber } from 'components/ui/data-display/StatsTileNumber'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useGetConfigs } from 'lib/api/lasius/issue-importers/issue-importers'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  onAdd: () => void
}

export const IntegrationsStats: React.FC<Props> = ({ onAdd }) => {
  const { t } = useTranslation('integrations')
  const { selectedOrganisationId } = useOrganisation()
  const orgId = selectedOrganisationId || ''

  // Fetch all configs to count them
  const { data: githubConfigs } = useGetConfigs(orgId, { type: 'github' as any })
  const { data: gitlabConfigs } = useGetConfigs(orgId, { type: 'gitlab' })
  const { data: jiraConfigs } = useGetConfigs(orgId, { type: 'jira' })
  const { data: planeConfigs } = useGetConfigs(orgId, { type: 'plane' })

  const totalConfigs =
    (githubConfigs?.length || 0) +
    (gitlabConfigs?.length || 0) +
    (jiraConfigs?.length || 0) +
    (planeConfigs?.length || 0)

  return (
    <div className="bg-base-200 flex items-start justify-between gap-4 p-4">
      <StatsGroup>
        <div className="stat h-fit">
          <div className="stat-title">
            {t('integrations.title', { defaultValue: 'Integrations' })}
          </div>
          <div className="stat-value text-2xl">
            {t('integrations.issueTrackers', { defaultValue: 'Issue Trackers' })}
          </div>
        </div>
        <StatsTileNumber
          value={totalConfigs}
          label={t('integrations.configurations', { defaultValue: 'Configurations' })}
          standalone={false}
        />
      </StatsGroup>
      <Button variant="neutral" size="sm" fullWidth={false} onClick={onAdd}>
        {t('integrations.actions.addIntegration', { defaultValue: 'Add Integration' })}
      </Button>
    </div>
  )
}
