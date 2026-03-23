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

import { Button } from '~/components/primitives/buttons/button'
import { StatsGroup } from '~/features/stats/components/stats-group'
import { StatsTileNumber } from '~/features/stats/components/stats-tile-number'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius/modelsIssueImporterConfigResponse'

type Props = {
  configs: ModelsIssueImporterConfigResponse[]
  onAddClick: () => void
}

export const IntegrationsStats = ({ configs, onAddClick }: Props) => {
  const { t } = useTranslation('integrations')

  const totalConfigs = configs.length

  return (
    <div className="bg-base-200 flex items-start justify-between gap-4 p-4">
      <StatsGroup>
        <div className="stat h-fit">
          <div className="stat-title">
            {t('integrations.title', { defaultValue: 'Integrations' })}
          </div>
          <div className="stat-value text-2xl">
            {t('integrations.issueTrackers', {
              defaultValue: 'Issue Trackers',
            })}
          </div>
        </div>
        <StatsTileNumber
          label={t('integrations.configurations', {
            defaultValue: 'Configurations',
          })}
          standalone={false}
          value={totalConfigs}
        />
      </StatsGroup>
      <Button
        className="w-auto"
        fullWidth={false}
        onClick={onAddClick}
        size="sm"
        variant="neutral"
      >
        {t('integrations.actions.addIntegration', {
          defaultValue: 'Add Integration',
        })}
      </Button>
    </div>
  )
}
