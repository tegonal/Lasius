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

import { lazy, Suspense } from 'react'

import { EmptyStateStats } from './empty-state-stats'
import { StatsTile } from './stats-tile'

const BarsTags = lazy(() =>
	import('./bars-tags').then((mod) => ({
		default: mod.BarsTags,
	})),
)

type StatsBarsByAggregatedTagsProps = {
	chartData:
		| undefined
		| {
				data: undefined | { id: string; value: number }[]
				keys?: (null | string | undefined)[]
		  }
}

export const StatsBarsByAggregatedTags = ({
	chartData,
}: StatsBarsByAggregatedTagsProps) => {
	if (!chartData?.data || chartData.data.length === 0) {
		return (
			<StatsTile className="h-[300px]">
				<EmptyStateStats />
			</StatsTile>
		)
	}

	return (
		<StatsTile
			className="min-h-[200px]"
			style={{ height: `${chartData.data.length * 36}px` }}
		>
			<Suspense
				fallback={
					<div className="bg-base-200 flex h-full w-full items-center justify-center rounded-lg">
						<span className="loading loading-spinner loading-md" />
					</div>
				}
			>
				<BarsTags stats={chartData} />
			</Suspense>
		</StatsTile>
	)
}
