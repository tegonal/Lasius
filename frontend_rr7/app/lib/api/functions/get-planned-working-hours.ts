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

import { eachDayOfInterval } from 'date-fns'

const weekdayNames: Record<number, string> = {
	0: 'sunday',
	1: 'monday',
	2: 'tuesday',
	3: 'wednesday',
	4: 'thursday',
	5: 'friday',
	6: 'saturday',
}

export type PlannedWorkingHours = Record<string, number>

const defaultPlannedWorkingHours: PlannedWorkingHours = {
	friday: 8,
	monday: 8,
	saturday: 0,
	sunday: 0,
	thursday: 8,
	tuesday: 8,
	wednesday: 8,
}

/** Get planned hours for a single date */
export const getPlannedHoursForDay = (
	date: Date,
	plannedHours: null | PlannedWorkingHours | undefined,
): number => {
	const hours = plannedHours ?? defaultPlannedWorkingHours
	const weekday = weekdayNames[date.getDay()] ?? 'monday'
	return hours[weekday] ?? 0
}

/** Sum planned hours across a date interval */
export const getPlannedHoursForRange = (
	start: Date,
	end: Date,
	plannedHours: null | PlannedWorkingHours | undefined,
): number => {
	const days = eachDayOfInterval({ end, start })
	return days.reduce(
		(sum, day) => sum + getPlannedHoursForDay(day, plannedHours),
		0,
	)
}

/** Get weekly planned hours total */
export const getWeeklyPlannedHours = (
	plannedHours: null | PlannedWorkingHours | undefined,
): number => {
	const hours = plannedHours ?? defaultPlannedWorkingHours
	return Object.values(hours).reduce((sum, h) => sum + h, 0)
}
