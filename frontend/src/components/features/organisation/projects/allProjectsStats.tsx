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
import { useGetProjectList } from 'lib/api/lasius/projects/projects'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  onCreateProject: () => void
}

export const AllProjectsStats: React.FC<Props> = ({ onCreateProject }) => {
  const { t } = useTranslation('common')
  const { selectedOrganisationId } = useOrganisation()
  const { data: projects } = useGetProjectList(selectedOrganisationId)

  const activeCount = projects?.filter((p) => p.active).length || 0
  const inactiveCount = projects?.filter((p) => !p.active).length || 0
  const totalCount = projects?.length || 0

  return (
    <div className="bg-base-200 flex items-start justify-between gap-4 p-4">
      <StatsGroup>
        <StatsTileNumber
          value={totalCount}
          label={t('projects.total', { defaultValue: 'Total' })}
          standalone={false}
        />
        <StatsTileNumber
          value={activeCount}
          label={t('common.status.active', { defaultValue: 'Active' })}
          standalone={false}
        />
        <StatsTileNumber
          value={inactiveCount}
          label={t('common.status.inactive', { defaultValue: 'Inactive' })}
          standalone={false}
        />
      </StatsGroup>
      <Button
        onClick={onCreateProject}
        size="sm"
        fullWidth={false}
        className="w-auto"
        variant="neutral">
        {t('projects.actions.create', { defaultValue: 'Create project' })}
      </Button>
    </div>
  )
}
