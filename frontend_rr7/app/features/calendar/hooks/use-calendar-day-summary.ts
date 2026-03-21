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

import { differenceInMilliseconds, isSameDay, parseISO } from 'date-fns'
import { useMemo } from 'react'

import { useCalendarData } from '~/features/calendar/calendar-data-provider'
import { type IsoDateString } from '~/lib/utils/dates'

const DEFAULT_PLANNED_HOURS = 8

/**
 * Compute duration in hours from start to end ISO date strings.
 */
const durationInHours = (start: string, end: string): number => {
	const ms = differenceInMilliseconds(new Date(end), new Date(start))
	return Math.round((ms / 1000 / 60 / 60) * 1000) / 1000
}

/**
 * Compute progress percentages given expected and worked hours.
 */
const getExpectedVsBookedPercentage = (expected: number, worked: number) => {
	let fulfilledPercentage = 0
	if (worked === 0) fulfilledPercentage = 0
	if (expected === 0 && worked > 0) fulfilledPercentage = 100
	if (expected > 0 && worked > 0)
		fulfilledPercentage = Math.round((worked / expected) * 100 * 100) / 100

	const progressBarPercentage =
		fulfilledPercentage > 90 && fulfilledPercentage < 100
			? 90
			: fulfilledPercentage > 100
				? 100
				: fulfilledPercentage

	return { fulfilledPercentage, progressBarPercentage }
}

/**
 * useCalendarDaySummary - Computes booking summary for a specific day from bulk calendar data
 *
 * This hook:
 * - Takes the pre-fetched bulk booking data from CalendarDataProvider
 * - Filters bookings for the specific day
 * - Computes summary statistics (hours, progress, etc.)
 *
 * Performance: No API calls - all data comes from context
 *
 * Note: plannedWorkingHours uses a fixed 8h default for now.
 * TODO: Replace with useGetPlannedWorkingHoursByDate when available.
 *
 * @param date - ISO date string for the day to summarize
 */
export const useCalendarDaySummary = (date: IsoDateString) => {
	const { bookings } = useCalendarData()
	const plannedWorkingHours = DEFAULT_PLANNED_HOURS
	const targetDate = useMemo(() => new Date(date), [date])

	// Filter bookings for this specific day
	const dayBookings = useMemo(() => {
		if (!bookings) return []

		return bookings.filter((booking) => {
			const bookingDate = parseISO(booking.start.dateTime)
			return isSameDay(bookingDate, targetDate)
		})
	}, [bookings, targetDate])

	// Calculate total hours for this day
	const hours = useMemo(() => {
		const total = dayBookings.reduce((acc, booking) => {
			if (!booking.end?.dateTime) return acc
			return acc + durationInHours(booking.start.dateTime, booking.end.dateTime)
		}, 0)
		return Math.round(total * 100) / 100
	}, [dayBookings])

	const elements = dayBookings.length

	// Calculate progress percentages
	const { fulfilledPercentage, progressBarPercentage } = useMemo(
		() => getExpectedVsBookedPercentage(plannedWorkingHours, hours),
		[plannedWorkingHours, hours],
	)

	return {
		elements,
		fulfilledPercentage,
		hours,
		plannedWorkingHours,
		progressBarPercentage,
	}
}
