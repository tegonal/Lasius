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
 * Minimal logger stub — will be replaced by tslog in Task 11.
 * Provides the same interface so consumers don't need to change.
 */
export const logger = {
	debug: (...args: unknown[]) => {
		console.debug('[DEBUG]', ...args)
	},
	error: (...args: unknown[]) => {
		console.error('[ERROR]', ...args)
	},
	info: (...args: unknown[]) => {
		console.info('[INFO]', ...args)
	},
	warn: (...args: unknown[]) => {
		console.warn('[WARN]', ...args)
	},
}
