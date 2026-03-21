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

import { describe, expect, it } from 'vitest'

import {
	apiTimespanDay,
	apiTimespanFromTo,
	apiTimespanMonth,
	apiTimespanWeek,
	formatISOLocale,
	getMonthOfDate,
	getWeekOfDate,
} from './dates'

describe('formatISOLocale', () => {
	it('formats a valid date to ISO string with timezone offset', () => {
		const date = new Date(2024, 0, 15, 10, 30, 0, 0)
		const result = formatISOLocale(date)
		// Should match pattern: yyyy-MM-ddTHH:mm:ss.SSS+HH:MM
		expect(result).toMatch(
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/,
		)
		expect(result).toContain('2024-01-15T10:30:00.000')
	})

	it('returns empty string for invalid date', () => {
		const result = formatISOLocale(new Date('invalid'))
		expect(result).toBe('')
	})
})

describe('getWeekOfDate', () => {
	it('returns 7 days for a week (Monday start)', () => {
		// 2024-01-15 is a Monday
		const result = getWeekOfDate(new Date(2024, 0, 15))
		expect(result).toHaveLength(7)
	})

	it('starts on Monday', () => {
		// 2024-01-17 is a Wednesday
		const result = getWeekOfDate(new Date(2024, 0, 17))
		expect(result[0]).toContain('2024-01-15') // Monday
		expect(result[6]).toContain('2024-01-21') // Sunday
	})

	it('accepts an ISO date string', () => {
		const result = getWeekOfDate('2024-01-17T10:00:00.000+01:00')
		expect(result).toHaveLength(7)
		expect(result[0]).toContain('2024-01-15')
	})
})

describe('getMonthOfDate', () => {
	it('returns correct number of days for January', () => {
		const result = getMonthOfDate(new Date(2024, 0, 15))
		expect(result).toHaveLength(31)
	})

	it('returns correct number of days for February (leap year)', () => {
		const result = getMonthOfDate(new Date(2024, 1, 10))
		expect(result).toHaveLength(29)
	})

	it('returns correct number of days for February (non-leap year)', () => {
		const result = getMonthOfDate(new Date(2023, 1, 10))
		expect(result).toHaveLength(28)
	})

	it('accepts an ISO date string', () => {
		const result = getMonthOfDate('2024-03-10T10:00:00.000+01:00')
		expect(result).toHaveLength(31)
	})
})

describe('apiTimespanWeek', () => {
	it('returns from/to spanning the full week', () => {
		// 2024-01-17 is a Wednesday
		const result = apiTimespanWeek('2024-01-17T10:00:00.000+01:00')
		expect(result.from).toContain('2024-01-15T00:00:00.000')
		expect(result.to).toContain('2024-01-21T23:59:59.999')
	})
})

describe('apiTimespanMonth', () => {
	it('returns from/to spanning the full month', () => {
		const result = apiTimespanMonth('2024-01-17T10:00:00.000+01:00')
		expect(result.from).toContain('2024-01-01T00:00:00.000')
		expect(result.to).toContain('2024-01-31T23:59:59.999')
	})
})

describe('apiTimespanDay', () => {
	it('returns from/to spanning the full day', () => {
		const result = apiTimespanDay('2026-03-15T10:00:00.000+01:00')
		expect(result.from).toContain('2026-03-15T00:00:00.000')
		expect(result.to).toContain('2026-03-15T23:59:59.999')
	})
})

describe('apiTimespanFromTo', () => {
	it('returns from/to spanning start of from-day to end of to-day', () => {
		const result = apiTimespanFromTo(
			'2026-03-01T10:00:00.000+01:00',
			'2026-03-15T10:00:00.000+01:00',
		)
		expect(result).not.toBeNull()
		expect(result!.from).toContain('2026-03-01T00:00:00.000')
		expect(result!.to).toContain('2026-03-15T23:59:59.999')
	})

	it('returns null for empty strings', () => {
		expect(apiTimespanFromTo('', '')).toBeNull()
	})
})
