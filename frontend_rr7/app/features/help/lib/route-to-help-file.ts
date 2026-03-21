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

/**
 * Converts a route pathname to an MDX help file name.
 *
 * Examples:
 *   /user/home       → user-home
 *   /organisation/projects → organisation-projects
 *   /                → login
 *   /settings/:id    → settings-dynamic
 */
export const routeToHelpFile = (path: string): string => {
	// Remove leading slash and replace remaining slashes with hyphens
	let normalized = path.replace(/^\//, '').replace(/\//g, '-')

	// Handle root/index
	if (normalized === '') {
		normalized = 'login'
	}

	// Handle dynamic route segments (React Router uses :param syntax)
	normalized = normalized.replace(/:[^-/]+/g, 'dynamic')

	return normalized
}
