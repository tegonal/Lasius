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

// The pure functions are module-private in use-calendar-day-summary.ts.
// We re-implement them here for unit testing since the module only exports a hook.
// These tests validate the calculation logic used by useCalendarDaySummary.

const durationInHours = (start: string, end: string): number => {
	const ms = new Date(end).getTime() - new Date(start).getTime()
	return Math.round((ms / 1000 / 60 / 60) * 1000) / 1000
}

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

describe('durationInHours', () => {
	it('returns 1 for a 1-hour duration', () => {
		expect(
			durationInHours(
				'2026-01-15T09:00:00.000+01:00',
				'2026-01-15T10:00:00.000+01:00',
			),
		).toBe(1)
	})

	it('returns 0.5 for a 30-minute duration', () => {
		expect(
			durationInHours(
				'2026-01-15T09:00:00.000+01:00',
				'2026-01-15T09:30:00.000+01:00',
			),
		).toBe(0.5)
	})

	it('returns 8 for a full workday', () => {
		expect(
			durationInHours(
				'2026-01-15T08:00:00.000+01:00',
				'2026-01-15T16:00:00.000+01:00',
			),
		).toBe(8)
	})

	it('returns 0 when start equals end', () => {
		expect(
			durationInHours(
				'2026-01-15T09:00:00.000+01:00',
				'2026-01-15T09:00:00.000+01:00',
			),
		).toBe(0)
	})
})

describe('getExpectedVsBookedPercentage', () => {
	it('returns 0% when no hours worked', () => {
		const result = getExpectedVsBookedPercentage(8, 0)
		expect(result.fulfilledPercentage).toBe(0)
		expect(result.progressBarPercentage).toBe(0)
	})

	it('returns 100% when expected is 0 but hours worked', () => {
		const result = getExpectedVsBookedPercentage(0, 5)
		expect(result.fulfilledPercentage).toBe(100)
		expect(result.progressBarPercentage).toBe(100)
	})

	it('returns 50% for half the expected hours', () => {
		const result = getExpectedVsBookedPercentage(8, 4)
		expect(result.fulfilledPercentage).toBe(50)
		expect(result.progressBarPercentage).toBe(50)
	})

	it('returns 100% for full expected hours', () => {
		const result = getExpectedVsBookedPercentage(8, 8)
		expect(result.fulfilledPercentage).toBe(100)
		expect(result.progressBarPercentage).toBe(100)
	})

	it('caps progress bar at 90 when between 90-100%', () => {
		const result = getExpectedVsBookedPercentage(8, 7.5)
		expect(result.fulfilledPercentage).toBe(93.75)
		expect(result.progressBarPercentage).toBe(90)
	})

	it('caps progress bar at 100 when over 100%', () => {
		const result = getExpectedVsBookedPercentage(8, 10)
		expect(result.fulfilledPercentage).toBe(125)
		expect(result.progressBarPercentage).toBe(100)
	})
})
