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

import { routeToHelpFile } from './route-to-help-file'

describe('routeToHelpFile', () => {
	it('maps root to user-home', () => {
		expect(routeToHelpFile('/')).toBe('user-home')
	})

	it('maps /dashboard to user-dashboard', () => {
		expect(routeToHelpFile('/dashboard')).toBe('user-dashboard')
	})

	it('maps /login to login', () => {
		expect(routeToHelpFile('/login')).toBe('login')
	})

	it('falls back to hyphenated path for unmapped routes', () => {
		expect(routeToHelpFile('/organisation/projects')).toBe(
			'organisation-projects',
		)
	})

	it('handles dynamic segments', () => {
		expect(routeToHelpFile('/settings/:id')).toBe('settings-dynamic')
	})

	it('handles empty string as user-home', () => {
		expect(routeToHelpFile('')).toBe('user-home')
	})
})
