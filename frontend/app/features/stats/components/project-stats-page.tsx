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

import { ColumnCenter, ColumnRight, innerGridClasses } from '~/components/ui/layouts/layout-columns'
import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { ChartErrorBoundary } from '~/features/stats/components/error-boundary-chart'
import { StatsBarsByAggregatedTags } from '~/features/stats/components/stats-bars-by-aggregated-tags'
import { StatsBarsBySource } from '~/features/stats/components/stats-bars-by-source'
import { StatsCircleCategoryRange } from '~/features/stats/components/stats-circle-category-range'
import { StatsFilter } from '~/features/stats/components/stats-filter'
import { StatsOverview } from '~/features/stats/components/stats-overview'
import { StatsProjectHeader } from '~/features/stats/components/stats-project-header'
import { StatsTabs } from '~/features/stats/components/stats-tabs'
import { StatsUserStream } from '~/features/stats/components/stats-user-stream'
import {
  getProjectsPath,
  getProjectStatsPath,
  type ProjectStatsScope,
  type ProjectStatsView,
  type StatsProject,
} from '~/features/stats/lib/project-stats'
import { type getModelsBookingSummary } from '~/lib/api/functions/get-models-booking-summary'
import { type getNivoChartDataFromApiStatsData } from '~/lib/api/functions/get-nivo-chart-data-from-api-stats-data'
import { type getTransformedChartDataAggregate } from '~/lib/api/functions/get-transformed-chart-data-aggregate'

type ProjectStatsPageProperties = {
  aggregatedChart: ReturnType<typeof getTransformedChartDataAggregate>
  bookingSummary: ReturnType<typeof getModelsBookingSummary>
  byPeriodChart: ReturnType<typeof getNivoChartDataFromApiStatsData>
  distinctUsers: number
  project: StatsProject
  scope: ProjectStatsScope
  useBarChart: boolean
  view: ProjectStatsView
}

export const ProjectStatsPage = ({
  aggregatedChart,
  bookingSummary,
  byPeriodChart,
  distinctUsers,
  project,
  scope,
  useBarChart,
  view,
}: ProjectStatsPageProperties) => {
  const { t } = useTranslation()
  const path = getProjectStatsPath(scope, project.id)

  const tabs = [
    { id: 'tags', label: t('tag-manager:title', 'Tags'), params: { view: 'tags' }, to: path },
    {
      id: 'users',
      label: t('organisation:members.title', 'Members'),
      params: { view: 'users' },
      to: path,
    },
  ]

  return (
    <div className={innerGridClasses} data-testid="project-stats-page">
      <ColumnCenter>
        <div className="flex h-full flex-col overflow-hidden">
          <div className="bg-base-200 flex-shrink-0 px-6 py-4">
            <StatsOverview
              distinctProjects={1}
              distinctUsers={distinctUsers}
              elements={bookingSummary.elements}
              hours={bookingSummary.hours}
            />
          </div>
          <div className="border-base-200 border-b px-6 pt-2">
            <StatsTabs selectedId={view} tabs={tabs} />
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="px-6 pt-4">
              <ChartErrorBoundary>
                {view === 'users' ? (
                  <>
                    <StatsCircleCategoryRange chartData={aggregatedChart} />
                    <div className="divider my-4" />
                    <StatsUserStream chartData={byPeriodChart} useBarChart={useBarChart} />
                  </>
                ) : (
                  <>
                    <StatsBarsBySource chartData={byPeriodChart} groupMode="stacked" />
                    <div className="divider my-4" />
                    <StatsBarsByAggregatedTags chartData={aggregatedChart} />
                  </>
                )}
              </ChartErrorBoundary>
            </div>
          </ScrollArea>
        </div>
      </ColumnCenter>
      <ColumnRight>
        <ScrollArea className="h-full">
          <div className="p-4">
            <StatsProjectHeader backTo={getProjectsPath(scope)} project={project} />
            <StatsFilter />
          </div>
        </ScrollArea>
      </ColumnRight>
    </div>
  )
}
