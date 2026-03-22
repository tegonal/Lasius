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

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { ChartErrorBoundary } from '~/components/ui/error-boundary-chart'
import { type TabItem, Tabs } from '~/components/ui/navigation/tabs'
import { type NivoChartDataType } from '~/lib/api/functions/get-nivo-chart-data-from-api-stats-data'

import { type BarChartGroupMode } from './bars-hours'
import { StatsBarsByAggregatedTags } from './stats-bars-by-aggregated-tags'
import { StatsBarsBySource } from './stats-bars-by-source'
import { StatsCircleCategoryRange } from './stats-circle-category-range'
import { StatsProjectStream } from './stats-project-stream'

type StatsContentProps = {
	projectsAggregatedChart:
		| undefined
		| {
				data: undefined | { id: string; value: number }[]
				keys?: (null | string | undefined)[]
		  }
	projectStreamChart:
		| undefined
		| {
				ceilingData: NivoChartDataType
				data: NivoChartDataType
				keys: string[]
		  }
	tagsAggregatedChart:
		| undefined
		| {
				data: undefined | { id: string; value: number }[]
				keys?: (null | string | undefined)[]
		  }
	tagsByDayChart:
		| undefined
		| {
				ceilingData: NivoChartDataType
				data: NivoChartDataType
				keys: string[]
		  }
	useBarChart: boolean
}

export const StatsContent = ({
	projectsAggregatedChart,
	projectStreamChart,
	tagsAggregatedChart,
	tagsByDayChart,
	useBarChart,
}: StatsContentProps) => {
	const { t } = useTranslation('common')

	const chartTabs: TabItem[] = useMemo(
		() => [
			{
				component: (
					<ChartErrorBoundary>
						<StatsCircleCategoryRange chartData={projectsAggregatedChart} />
						<div className="divider my-4" />
						<StatsProjectStream
							chartData={projectStreamChart}
							useBarChart={useBarChart}
						/>
					</ChartErrorBoundary>
				),
				label: t('projects.title', { defaultValue: 'Projects' }),
			},
			{
				component: (
					<ChartErrorBoundary>
						<StatsBarsBySource
							chartData={tagsByDayChart}
							groupMode={'stacked' as BarChartGroupMode}
						/>
						<div className="divider my-4" />
						<StatsBarsByAggregatedTags chartData={tagsAggregatedChart} />
					</ChartErrorBoundary>
				),
				label: t('tags.title', { defaultValue: 'Tags' }),
			},
		],
		[
			projectsAggregatedChart,
			projectStreamChart,
			useBarChart,
			tagsByDayChart,
			tagsAggregatedChart,
			t,
		],
	)

	return (
		<div className="px-6">
			<Tabs tabs={chartTabs} />
		</div>
	)
}
