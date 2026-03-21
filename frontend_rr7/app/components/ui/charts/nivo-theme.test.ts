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

import { getConsistentColor, nivoTheme } from './nivo-theme'

describe('nivoTheme', () => {
	it('has transparent background', () => {
		expect(nivoTheme.background).toBe('transparent')
	})

	it('uses CSS variables for text color', () => {
		expect(nivoTheme.textColor).toBe('var(--color-base-content)')
	})
})

describe('getConsistentColor', () => {
	it('returns the same color for the same key', () => {
		const color1 = getConsistentColor('Week 1', false)
		const color2 = getConsistentColor('Week 1', false)
		expect(color1).toBe(color2)
	})

	it('returns a string starting with #', () => {
		const color = getConsistentColor('test', false)
		expect(color).toMatch(/^#[0-9a-f]{6}$/i)
	})

	it('returns different palettes for light vs dark', () => {
		// Not all keys produce different colors, but at least one should differ
		const keys = ['Week 1', 'Week 2', 'Week 3', 'Project A', 'Project B']
		const hasDifference = keys.some(
			(key) => getConsistentColor(key, false) !== getConsistentColor(key, true),
		)
		expect(hasDifference).toBe(true)
	})

	it('handles empty string key', () => {
		const color = getConsistentColor('', false)
		expect(color).toMatch(/^#[0-9a-f]{6}$/i)
	})
})
