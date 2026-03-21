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
	eachDayOfInterval,
	endOfDay,
	endOfMonth,
	endOfWeek,
	format,
	isValid,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from 'date-fns'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ApiDateParam = string
export type IsoDateString = string

// ─── Constants ───────────────────────────────────────────────────────────────

export const apiUrlDateParamFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS"

// ─── Core date utilities ─────────────────────────────────────────────────────

/**
 * Formats a Date object to ISO 8601 string with timezone offset.
 * Temporary fix until date-fns includes milliseconds in ISO format.
 *
 * @param d - The Date object to format
 * @returns ISO 8601 formatted string with timezone (e.g., "2024-01-15T10:30:00.000+02:00")
 */
export const formatISOLocale = (d: Date): string => {
	// copied from date-fns
	const addLeadingZeros = (number: number, targetLength: number) => {
		const sign = number < 0 ? '-' : ''
		let output = Math.abs(number).toString()
		while (output.length < targetLength) {
			output = `0${output}`
		}
		return sign + output
	}

	// our backend needs the Timezone as: signHH:MM, e.g. `+02:00`
	// copied from date-fns
	const formatTimezoneShort = (offset: number, delimiter = ':') => {
		const sign = offset > 0 ? '-' : '+'
		const absOffset = Math.abs(offset)
		const hours = Math.floor(absOffset / 60)
		const minutes = Math.round(absOffset % 60)
		return (
			sign + addLeadingZeros(hours, 2) + delimiter + addLeadingZeros(minutes, 2)
		)
	}

	if (isValid(d)) {
		return (
			format(d, "yyyy-MM-dd'T'HH':'mm':'ss'.'SSS") +
			formatTimezoneShort(d.getTimezoneOffset())
		)
	}
	return ''
}

/**
 * Get an array of IsoDateStrings that represent the days of the week that date is in
 * @param date
 */
export const getWeekOfDate = (date: Date | IsoDateString): IsoDateString[] => {
	const localDate = typeof date === 'string' ? new Date(date) : date
	return eachDayOfInterval({
		end: endOfWeek(localDate, { weekStartsOn: 1 }),
		start: startOfWeek(localDate, { weekStartsOn: 1 }),
	}).map((d) => formatISOLocale(d))
}

/**
 * Get an array of IsoDateStrings that represent the days of the month that date is in
 * @param date
 */
export const getMonthOfDate = (date: Date | IsoDateString): IsoDateString[] => {
	const localDate = typeof date === 'string' ? new Date(date) : date
	return eachDayOfInterval({
		end: endOfMonth(localDate),
		start: startOfMonth(localDate),
	}).map((d) => formatISOLocale(d))
}

// ─── API timespan helpers ────────────────────────────────────────────────────

export const formatDateTimeToURLParam = (date: Date): ApiDateParam => {
	if (!date || !isValid(date)) {
		throw new Error(
			`Invalid date provided to formatDateTimeToURLParam: ${date}`,
		)
	}
	return format(date, apiUrlDateParamFormat)
}

/**
 * Get from and to date based on a given day, spanning the entire week this day is part of
 * @param date
 */
export const apiTimespanWeek = (
	date: IsoDateString,
): { from: ApiDateParam; to: ApiDateParam } => {
	const dateObj = new Date(date)
	return {
		from: formatDateTimeToURLParam(
			startOfDay(startOfWeek(dateObj, { weekStartsOn: 1 })),
		),
		to: formatDateTimeToURLParam(
			endOfDay(endOfWeek(dateObj, { weekStartsOn: 1 })),
		),
	}
}

/**
 * Get from and to date based on a given day, spanning the entire month this day is part of
 * @param date
 */
export const apiTimespanMonth = (
	date: IsoDateString,
): { from: ApiDateParam; to: ApiDateParam } => {
	const dateObj = new Date(date)
	return {
		from: formatDateTimeToURLParam(startOfDay(startOfMonth(dateObj))),
		to: formatDateTimeToURLParam(endOfDay(endOfMonth(dateObj))),
	}
}

/**
 * Get from and to date spanning the entire day
 */
export const apiTimespanDay = (
	date: IsoDateString,
): { from: ApiDateParam; to: ApiDateParam } => {
	const dateObj = new Date(date)
	return {
		from: formatDateTimeToURLParam(startOfDay(dateObj)),
		to: formatDateTimeToURLParam(endOfDay(dateObj)),
	}
}

/**
 * Get from and to spanning start-of-from-day to end-of-to-day.
 * Returns null for empty/invalid dates (skip API call).
 */
export const apiTimespanFromTo = (
	from: IsoDateString,
	to: IsoDateString,
): null | { from: ApiDateParam; to: ApiDateParam } => {
	if (!from || !to) return null
	const fromDate = new Date(from)
	const toDate = new Date(to)
	if (!isValid(fromDate) || !isValid(toDate)) return null
	return {
		from: formatDateTimeToURLParam(startOfDay(fromDate)),
		to: formatDateTimeToURLParam(endOfDay(toDate)),
	}
}
