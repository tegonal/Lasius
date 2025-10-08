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

import { StatsBarsByAggregatedTags } from 'components/features/organisation/stats/statsBarsByAggregatedTags'
import { StatsBarsBySource } from 'components/features/organisation/stats/statsBarsBySource'
import { StatsCircleCategoryRange } from 'components/features/organisation/stats/statsCircleCategoryRange'
import { StatsProjectStream } from 'components/features/organisation/stats/statsProjectStream'
import { StatsUserStream } from 'components/features/organisation/stats/statsUserStream'
import { ColumnList } from 'components/primitives/layout/ColumnList'
import { ErrorBoundary } from 'components/ui/feedback/ErrorBoundary'
import { Tabs } from 'components/ui/navigation/Tabs'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { useIsClient } from 'usehooks-ts'

export const StatsContent: React.FC = () => {
  const { t } = useTranslation('common')
  const { selectedOrganisationId } = useOrganisation()
  const isClient = useIsClient()

  if (!isClient) return null

  const chartTabs = [
    {
      label: t('projects.title', { defaultValue: 'Projects' }),
      component: (
        <>
          <ErrorBoundary>
            <StatsCircleCategoryRange source="project" />
          </ErrorBoundary>
          <div className="divider my-4" />
          <ErrorBoundary>
            <StatsProjectStream />
          </ErrorBoundary>
        </>
      ),
    },
    {
      label: t('users.title', { defaultValue: 'Users' }),
      component: (
        <>
          <ErrorBoundary>
            <StatsCircleCategoryRange source="user" />
          </ErrorBoundary>
          <div className="divider my-4" />
          <ErrorBoundary>
            <StatsUserStream />
          </ErrorBoundary>
        </>
      ),
    },
    {
      label: t('tags.title', { defaultValue: 'Tags' }),
      component: (
        <>
          <ErrorBoundary>
            <StatsBarsBySource source="tag" groupMode="stacked" />
          </ErrorBoundary>
          <div className="divider my-4" />
          <ErrorBoundary>
            <StatsBarsByAggregatedTags />
          </ErrorBoundary>
        </>
      ),
    },
  ]

  return (
    <ColumnList key={selectedOrganisationId}>
      <Tabs tabs={chartTabs} />
    </ColumnList>
  )
}
