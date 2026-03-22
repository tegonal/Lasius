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

import {
	eachWeekOfInterval,
	endOfMonth,
	format,
	getWeek,
	startOfMonth,
} from 'date-fns'
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { data } from 'react-router'

import { FormatDate } from '~/components/ui/data-display/format-date'
import { StatsOverviewGrid } from '~/features/dashboard/components/stats-overview-grid'
import { TopProjectsCard } from '~/features/dashboard/components/top-projects-card'
import { aggregateProjectHours } from '~/lib/api/functions/aggregate-project-hours'
import { getExpectedVsBookedPercentage } from '~/lib/api/functions/get-expected-vs-booked-percentage'
import { getModelsBookingSummary } from '~/lib/api/functions/get-models-booking-summary'
import { getPlannedHoursForRange } from '~/lib/api/functions/get-planned-working-hours'
import { apiTimespanMonth, formatISOLocale } from '~/lib/utils/dates'
import { cachedServerLoader } from '~/lib/utils/loader-cache'
import { type ModelsBooking } from '~/services/api/lasius'
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

import { type Route } from './+types/dashboard.month'

const MonthStreamChart = lazy(() =>
	import('~/components/ui/charts/month-stream-chart').then((mod) => ({
		default: mod.MonthStreamChart,
	})),
)

// ─── Client Loader (cache unless full-page refresh) ──────────────────────────

export const clientLoader = async ({
	request,
	serverLoader,
}: Route.ClientLoaderArgs) => cachedServerLoader(request, serverLoader)
clientLoader.hydrate = false

// ─── Stream chart computation ────────────────────────────────────────────────

function computeStreamChartData(
	bookings: ModelsBooking[],
	selectedDate: string,
) {
	const dateObj = new Date(selectedDate)
	const monthStart = startOfMonth(dateObj)
	const monthEnd = endOfMonth(dateObj)

	const weeks = eachWeekOfInterval(
		{ end: monthEnd, start: monthStart },
		{ weekStartsOn: 1 },
	)
	const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

	// Create a map to store hours by day and week
	const hoursMap = new Map<string, Map<string, number>>()
	weekDays.forEach((day) => {
		const weekMap = new Map<string, number>()
		weeks.forEach((weekStart) => {
			const weekNum = getWeek(weekStart, { weekStartsOn: 1 })
			weekMap.set(`Week ${weekNum}`, 0)
		})
		hoursMap.set(day, weekMap)
	})

	// Process bookings and aggregate by day and week
	bookings.forEach((booking) => {
		const bookingDate = new Date(booking.start.dateTime)
		const dayName = format(bookingDate, 'EEE')
		const weekNum = getWeek(bookingDate, { weekStartsOn: 1 })
		const weekLabel = `Week ${weekNum}`

		const dayMap = hoursMap.get(dayName)
		if (dayMap && dayMap.has(weekLabel)) {
			const hours = getModelsBookingSummary([booking]).hours
			dayMap.set(weekLabel, (dayMap.get(weekLabel) ?? 0) + hours)
		}
	})

	// Convert map to Nivo format: array of 7 objects (one per weekday)
	const streamData: Record<string, number>[] = []
	weekDays.forEach((day) => {
		const dayData: Record<string, number> = {}
		const dayMap = hoursMap.get(day)
		if (dayMap) {
			dayMap.forEach((value, weekLabel) => {
				dayData[weekLabel] = Number(value.toFixed(2))
			})
		}
		streamData.push(dayData)
	})

	// Only include weeks that have non-zero booking hours
	const allKeys = new Set<string>()
	streamData.forEach((dayData) => {
		Object.keys(dayData).forEach((key) => {
			if (key.startsWith('Week')) {
				const hasHours = streamData.some((d) => (d[key] as number) > 0)
				if (hasHours) {
					allKeys.add(key)
				}
			}
		})
	})
	const streamKeys = Array.from(allKeys).sort()

	return { data: streamData, keys: streamKeys }
}

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

	const monthTimespan = apiTimespanMonth(selectedDate)
	const dateObj = new Date(selectedDate)
	const monthStartDate = startOfMonth(dateObj)
	const monthEndDate = endOfMonth(dateObj)

	// Fetch month bookings and aggregated project stats in parallel
	const [monthBookingsRes, projectStatsRes] = await Promise.all([
		getUserBookingListByOrganisation(selectedOrgId, monthTimespan, {
			headers,
		}),
		getUserBookingAggregatedStatsByOrganisation(
			selectedOrgId,
			{
				from: format(monthStartDate, 'yyyy-MM-dd'),
				granularity: 'Day',
				source: 'project',
				to: format(monthEndDate, 'yyyy-MM-dd'),
			},
			{ headers },
		),
	])

	const monthBookings = monthBookingsRes.data ?? []
	const projectStats = projectStatsRes.data ?? []

	// Compute month summary
	const summary = getModelsBookingSummary(monthBookings)
	const expectedHours = getPlannedHoursForRange(
		monthStartDate,
		monthEndDate,
		plannedHours,
	)
	const { fulfilledPercentage } = getExpectedVsBookedPercentage(
		expectedHours,
		summary.hours,
	)

	// Aggregate top projects
	const topProjects = aggregateProjectHours(projectStats, 5)

	// Compute stream chart data
	const streamChart = computeStreamChartData(monthBookings, selectedDate)

	return data(
		{
			selectedDate,
			stats: {
				bookings: summary.elements,
				expectedHours,
				fulfilledPercentage,
				hours: summary.hours,
			},
			streamChart,
			topProjects,
		},
		{ headers: mergeAuthHeaders(auth) },
	)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardMonth({ loaderData }: Route.ComponentProps) {
	const { t } = useTranslation('common')
	const { selectedDate, stats, streamChart, topProjects } = loaderData
	const dateObj = new Date(selectedDate)

	return (
		<div className="space-y-6 px-8 py-6">
			<h2 className="text-lg font-semibold">
				<FormatDate date={dateObj} format="monthNameLong" />{' '}
				<FormatDate date={dateObj} format="year" />
			</h2>
			<div className="flex gap-4">
				<StatsOverviewGrid {...stats} period="month" />
				<TopProjectsCard
					emptyMessage={t('statistics.noProjectsForMonth', {
						defaultValue: 'No projects for this month',
					})}
					projects={topProjects}
				/>
			</div>
			{streamChart.keys.length > 0 && (
				<>
					<h3 className="text-base font-semibold">
						{t('statistics.weeklyHoursDistribution', {
							defaultValue: 'Weekly Hours Distribution',
						})}
					</h3>
					<Suspense
						fallback={
							<div className="bg-base-200 h-64 w-full animate-pulse rounded" />
						}
					>
						<MonthStreamChart data={streamChart.data} keys={streamChart.keys} />
					</Suspense>
				</>
			)}
		</div>
	)
}
