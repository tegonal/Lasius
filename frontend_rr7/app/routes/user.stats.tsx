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

import { data, type ShouldRevalidateFunctionArgs } from 'react-router'

import {
	ColumnCenter,
	ColumnRight,
	innerGridClasses,
} from '~/components/ui/layouts/layout-columns'
import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { StatsContent } from '~/features/stats/components/stats-content'
import { StatsExport } from '~/features/stats/components/stats-export'
import { StatsFilter } from '~/features/stats/components/stats-filter'
import { StatsOverview } from '~/features/stats/components/stats-overview'
import {
	getAdaptiveGranularity,
	shouldUseBarChart,
} from '~/lib/api/config/granularity-config'
import { getModelsBookingSummary } from '~/lib/api/functions/get-models-booking-summary'
import { getNivoChartDataFromApiStatsData } from '~/lib/api/functions/get-nivo-chart-data-from-api-stats-data'
import { getTransformedChartDataAggregate } from '~/lib/api/functions/get-transformed-chart-data-aggregate'
import { dateOptions } from '~/lib/utils/date/date-options'
import { apiDatespanFromTo, apiTimespanFromTo } from '~/lib/utils/dates'
import { cachedServerLoader } from '~/lib/utils/loader-cache'
import {
	getUserBookingAggregatedStatsByOrganisation,
	getUserBookingListByOrganisation,
} from '~/services/api/lasius/user-bookings/user-bookings'
import { getUserProfile } from '~/services/api/lasius/user/user'
import {
	authHeaders,
	mergeAuthHeaders,
	requireUser,
} from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/user.stats'

// ─── Revalidation ────────────────────────────────────────────────────────────

/** Only revalidate when date range search params change */
export const shouldRevalidate = ({
	currentUrl,
	defaultShouldRevalidate,
	formMethod,
	nextUrl,
}: ShouldRevalidateFunctionArgs) => {
	if (formMethod) return defaultShouldRevalidate
	const currentFrom = currentUrl.searchParams.get('from')
	const currentTo = currentUrl.searchParams.get('to')
	const currentDateRange = currentUrl.searchParams.get('dateRange')
	const nextFrom = nextUrl.searchParams.get('from')
	const nextTo = nextUrl.searchParams.get('to')
	const nextDateRange = nextUrl.searchParams.get('dateRange')
	if (
		currentFrom === nextFrom &&
		currentTo === nextTo &&
		currentDateRange === nextDateRange
	) {
		return false
	}
	return defaultShouldRevalidate
}

// ─── Client Loader (cache unless full-page refresh) ──────────────────────────

export const clientLoader = async ({
	request,
	serverLoader,
}: Route.ClientLoaderArgs) => cachedServerLoader(request, serverLoader)
clientLoader.hydrate = false

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = async ({ request }: Route.LoaderArgs) => {
	const auth = await requireUser(request)
	const headers = authHeaders(auth.session)

	const profile = await getUserProfile({ headers })
	const user = profile.data

	// Determine selected org
	const organisations = user.organisations ?? []
	const selectedOrgId =
		user.settings?.lastSelectedOrganisation?.id ??
		organisations.find((o) => o.private)?.organisationReference.id ??
		organisations[0]?.organisationReference.id ??
		''

	// Read date range from URL search params or compute defaults
	const url = new URL(request.url)
	let from = url.searchParams.get('from')
	let to = url.searchParams.get('to')

	if (!from || !to) {
		const defaultRange = dateOptions[0]?.dateRangeFn(new Date())
		from = defaultRange?.from ?? ''
		to = defaultRange?.to ?? ''
	}

	const granularity = getAdaptiveGranularity(from, to)
	const useBarChart = shouldUseBarChart(from, to)

	// Compute API params
	const timespan = apiTimespanFromTo(from, to)
	const datespan = apiDatespanFromTo(from, to)

	// Fetch all data in parallel
	const [
		bookingsRes,
		projectsByDayRes,
		tagsByDayRes,
		projectsAggregatedRes,
		tagsAggregatedRes,
	] = await Promise.all([
		timespan
			? getUserBookingListByOrganisation(selectedOrgId, timespan, {
					headers,
				})
			: Promise.resolve({ data: [] }),
		datespan
			? getUserBookingAggregatedStatsByOrganisation(
					selectedOrgId,
					{
						from: datespan.from,
						granularity,
						source: 'project',
						to: datespan.to,
					},
					{ headers },
				)
			: Promise.resolve({ data: [] }),
		datespan
			? getUserBookingAggregatedStatsByOrganisation(
					selectedOrgId,
					{
						from: datespan.from,
						granularity,
						source: 'tag',
						to: datespan.to,
					},
					{ headers },
				)
			: Promise.resolve({ data: [] }),
		datespan
			? getUserBookingAggregatedStatsByOrganisation(
					selectedOrgId,
					{
						from: datespan.from,
						granularity: 'All',
						source: 'project',
						to: datespan.to,
					},
					{ headers },
				)
			: Promise.resolve({ data: [] }),
		datespan
			? getUserBookingAggregatedStatsByOrganisation(
					selectedOrgId,
					{
						from: datespan.from,
						granularity: 'All',
						source: 'tag',
						to: datespan.to,
					},
					{ headers },
				)
			: Promise.resolve({ data: [] }),
	])

	const bookings = bookingsRes.data ?? []
	const projectsByDay = projectsByDayRes.data ?? []
	const tagsByDay = tagsByDayRes.data ?? []
	const projectsAggregated = projectsAggregatedRes.data ?? []
	const tagsAggregated = tagsAggregatedRes.data ?? []

	// Transform data server-side
	const bookingSummary = getModelsBookingSummary(bookings)

	const distinctUsers = new Set(
		bookings.map((b) => b.userReference?.id).filter(Boolean),
	).size
	const distinctProjects = new Set(
		bookings.map((b) => b.projectReference?.id).filter(Boolean),
	).size

	const projectStreamChart = getNivoChartDataFromApiStatsData(
		projectsByDay,
		granularity,
	)
	const tagsByDayChart = getNivoChartDataFromApiStatsData(
		tagsByDay,
		granularity,
	)
	const projectsAggregatedChart =
		getTransformedChartDataAggregate(projectsAggregated)
	const tagsAggregatedChart = getTransformedChartDataAggregate(tagsAggregated)

	return data(
		{
			bookingSummary,
			distinctProjects,
			distinctUsers,
			from,
			projectsAggregated,
			projectsAggregatedChart,
			projectsByDay,
			projectStreamChart,
			tagsAggregated,
			tagsAggregatedChart,
			tagsByDay,
			tagsByDayChart,
			to,
			useBarChart,
		},
		{ headers: mergeAuthHeaders(auth) },
	)
}

// ─── Component ───────────────────────────────────────────────────────────────

const UserStats = ({ loaderData }: Route.ComponentProps) => {
	const {
		bookingSummary,
		distinctProjects,
		distinctUsers,
		from,
		projectsAggregated,
		projectsAggregatedChart,
		projectsByDay,
		projectStreamChart,
		tagsAggregated,
		tagsAggregatedChart,
		tagsByDay,
		tagsByDayChart,
		to,
		useBarChart,
	} = loaderData

	return (
		<div className={innerGridClasses} data-testid="stats-page">
			<ColumnCenter>
				<div className="flex h-full flex-col overflow-hidden">
					<div className="bg-base-200 flex-shrink-0 px-6 py-4">
						<div className="flex items-start justify-between gap-4">
							<div className="flex-1">
								<StatsOverview
									distinctProjects={distinctProjects}
									distinctUsers={distinctUsers}
									elements={bookingSummary.elements}
									hours={bookingSummary.hours}
								/>
							</div>
							<div className="flex-shrink-0">
								<StatsExport
									bookingList={bookingSummary}
									distinctProjects={distinctProjects}
									distinctUsers={distinctUsers}
									from={from}
									projectsAggregated={projectsAggregated}
									projectsByDay={projectsByDay}
									tagsAggregated={tagsAggregated}
									tagsByDay={tagsByDay}
									to={to}
								/>
							</div>
						</div>
					</div>
					<ScrollArea className="min-h-0 flex-1">
						<div className="pt-4">
							<StatsContent
								projectsAggregatedChart={projectsAggregatedChart}
								projectStreamChart={projectStreamChart}
								tagsAggregatedChart={tagsAggregatedChart}
								tagsByDayChart={tagsByDayChart}
								useBarChart={useBarChart}
							/>
						</div>
					</ScrollArea>
				</div>
			</ColumnCenter>
			<ColumnRight>
				<ScrollArea className="h-full">
					<div className="p-4">
						<StatsFilter />
					</div>
				</ScrollArea>
			</ColumnRight>
		</div>
	)
}

export default UserStats
