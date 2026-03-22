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

import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { data } from 'react-router'

import { FormatDate } from '~/components/ui/data-display/format-date'
import { StatsOverviewGrid } from '~/features/dashboard/components/stats-overview-grid'
import { TopProjectsCard } from '~/features/dashboard/components/top-projects-card'
import { aggregateProjectHours } from '~/lib/api/functions/aggregate-project-hours'
import { getExpectedVsBookedPercentage } from '~/lib/api/functions/get-expected-vs-booked-percentage'
import { getModelsBookingSummary } from '~/lib/api/functions/get-models-booking-summary'
import { getPlannedHoursForDay } from '~/lib/api/functions/get-planned-working-hours'
import { apiTimespanDay, formatISOLocale } from '~/lib/utils/dates'
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

import { type Route } from './+types/dashboard.day'

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

	// Extract planned working hours for the selected org
	const selectedOrg = organisations.find(
		(o) => o.organisationReference.id === selectedOrgId,
	)
	const plannedHours = selectedOrg?.plannedWorkingHours
		? { ...selectedOrg.plannedWorkingHours }
		: null

	// Read selected date from URL search param, fall back to today
	const url = new URL(request.url)
	const selectedDate =
		url.searchParams.get('date') || formatISOLocale(new Date())

	const dayTimespan = apiTimespanDay(selectedDate)
	const dateObj = new Date(selectedDate)
	const dayDate = format(dateObj, 'yyyy-MM-dd')

	// Fetch day bookings and aggregated project stats in parallel
	const [dayBookingsRes, projectStatsRes] = await Promise.all([
		getUserBookingListByOrganisation(selectedOrgId, dayTimespan, {
			headers,
		}),
		getUserBookingAggregatedStatsByOrganisation(
			selectedOrgId,
			{
				from: dayDate,
				granularity: 'Day',
				source: 'project',
				to: dayDate,
			},
			{ headers },
		),
	])

	const dayBookings = dayBookingsRes.data ?? []
	const projectStats = projectStatsRes.data ?? []

	// Compute day summary
	const summary = getModelsBookingSummary(dayBookings)
	const expectedHours = getPlannedHoursForDay(dateObj, plannedHours)
	const { fulfilledPercentage } = getExpectedVsBookedPercentage(
		expectedHours,
		summary.hours,
	)

	// Aggregate ALL projects (day shows all, no topN limit)
	const projects = aggregateProjectHours(projectStats)

	return data(
		{
			projects,
			selectedDate,
			stats: {
				bookings: summary.elements,
				expectedHours,
				fulfilledPercentage,
				hours: summary.hours,
			},
		},
		{ headers: mergeAuthHeaders(auth) },
	)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardDay({ loaderData }: Route.ComponentProps) {
	const { t } = useTranslation('common')
	const { projects, selectedDate, stats } = loaderData
	const dateObj = new Date(selectedDate)

	return (
		<div className="space-y-6 px-8 py-6">
			<h2 className="text-lg font-semibold">
				<FormatDate date={dateObj} format="fullDateShort" />
			</h2>
			<div className="flex gap-4">
				<StatsOverviewGrid {...stats} period="day" />
				<TopProjectsCard
					emptyMessage={t('statistics.noProjectsForDay', {
						defaultValue: 'No projects for this day',
					})}
					projects={projects}
					showTopPrefix={false}
				/>
			</div>
		</div>
	)
}
