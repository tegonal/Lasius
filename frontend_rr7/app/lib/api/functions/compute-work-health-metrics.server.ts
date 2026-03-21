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

import { getWeek, subWeeks } from 'date-fns'

import { durationInHoursAsNumber } from '~/lib/utils/duration'
import { type ModelsBooking } from '~/services/api/lasius/modelsBooking'

export type BurnoutLevel = 'healthy' | 'risk' | 'warning'

export type BurnoutMetrics = {
	averageDailyHours: number
	consecutiveDays: number
	level: BurnoutLevel
	overtimePercentage: number
	plannedHours: number
	weeklyHours: number
}

export type WeekData = {
	hours: number
	plannedHours: number
	weekLabel: string
	weekNumber: number
	year: number
}

/**
 * Compute work health metrics including burnout indicators and weekly trends.
 * Pure server-side function ported from the useWorkHealthMetrics client hook.
 *
 * @param bookings - Booking records for the analysis period
 * @param plannedWeeklyHours - Weekly planned hours
 * @param weeksToAnalyze - Number of weeks to analyze
 * @param referenceDate - ISO date string used as reference point
 */
export const computeWorkHealthMetrics = (
	bookings: ModelsBooking[],
	plannedWeeklyHours: number,
	weeksToAnalyze: number,
	referenceDate: string,
): { burnoutMetrics: BurnoutMetrics | null; weeklyData: WeekData[] } => {
	if (!bookings || bookings.length === 0) {
		return { burnoutMetrics: null, weeklyData: [] }
	}

	const refDate = new Date(referenceDate)

	// Group bookings by week
	const weekMap = new Map<string, { dates: Set<string>; hours: number }>()

	bookings.forEach((booking) => {
		const startDateTime = booking.start?.dateTime
		const endDateTime = booking.end?.dateTime
		if (!startDateTime || !endDateTime) return

		const bookingDate = new Date(startDateTime)
		const weekNum = getWeek(bookingDate, { weekStartsOn: 1 })
		const year = bookingDate.getFullYear()
		const weekKey = `${year}-W${weekNum}`
		const dateKey = bookingDate.toISOString().split('T')[0] ?? ''

		if (!weekMap.has(weekKey)) {
			weekMap.set(weekKey, { dates: new Set(), hours: 0 })
		}

		const weekData = weekMap.get(weekKey)!
		weekData.hours += durationInHoursAsNumber(startDateTime, endDateTime)
		weekData.dates.add(dateKey)
	})

	// Create weekly data array
	const weeks: WeekData[] = []
	for (let i = weeksToAnalyze - 1; i >= 0; i--) {
		const weekDate = subWeeks(refDate, i)
		const weekNum = getWeek(weekDate, { weekStartsOn: 1 })
		const year = weekDate.getFullYear()
		const weekKey = `${year}-W${weekNum}`
		const weekData = weekMap.get(weekKey)

		weeks.push({
			hours: weekData?.hours || 0,
			plannedHours: plannedWeeklyHours,
			weekLabel: `W${weekNum}`,
			weekNumber: weekNum,
			year,
		})
	}

	// Calculate burnout metrics for current week (last item in array)
	const currentWeek = weeks[weeks.length - 1]
	if (!currentWeek) {
		return { burnoutMetrics: null, weeklyData: weeks }
	}

	const overtimePercentage =
		(currentWeek.hours / plannedWeeklyHours) * 100 - 100

	// Calculate consecutive working days (simplified - using current week's date count)
	const currentWeekKey = `${currentWeek.year}-W${currentWeek.weekNumber}`
	const currentWeekData = weekMap.get(currentWeekKey)
	const consecutiveDays = currentWeekData?.dates.size || 0

	// Calculate average daily hours for current week
	const averageDailyHours =
		consecutiveDays > 0 ? currentWeek.hours / consecutiveDays : 0

	// Determine burnout level
	let level: BurnoutLevel = 'healthy'

	if (
		currentWeek.hours > plannedWeeklyHours * 1.25 || // >125% planned
		consecutiveDays >= 7 ||
		averageDailyHours > 10
	) {
		level = 'risk'
	} else if (
		currentWeek.hours > plannedWeeklyHours * 1.1 || // >110% planned
		consecutiveDays >= 6 ||
		averageDailyHours >= 9
	) {
		level = 'warning'
	}

	const metrics: BurnoutMetrics = {
		averageDailyHours,
		consecutiveDays,
		level,
		overtimePercentage,
		plannedHours: plannedWeeklyHours,
		weeklyHours: currentWeek.hours,
	}

	return { burnoutMetrics: metrics, weeklyData: weeks }
}
