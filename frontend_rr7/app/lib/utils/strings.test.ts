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

import { cleanStrForCmp } from './strings'

describe('cleanStrForCmp', () => {
	it('converts to uppercase', () => {
		expect(cleanStrForCmp('hello')).toBe('HELLO')
	})

	it('trims whitespace', () => {
		expect(cleanStrForCmp('  hello  ')).toBe('HELLO')
	})

	it('handles mixed case with whitespace', () => {
		expect(cleanStrForCmp('  Hello World  ')).toBe('HELLO WORLD')
	})

	it('returns empty string for empty input', () => {
		expect(cleanStrForCmp('')).toBe('')
	})

	it('enables case-insensitive comparison', () => {
		expect(cleanStrForCmp('test')).toBe(cleanStrForCmp('TEST'))
	})
})
