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

import { redirect } from 'react-router'

import { getSessionTokens } from './session.server'
import { type LasiusSessionData } from './types'

/** Build authorization headers for backend API calls */
export function authHeaders(
	session: LasiusSessionData,
): Record<string, string> {
	return {
		Authorization: `Bearer ${session.accessToken}`,
		'X-Token-Issuer': session.tokenIssuer,
	}
}

/**
 * Get the current user session if it exists, without requiring authentication.
 * Use in loaders that show different content for authenticated vs anonymous users.
 */
export async function getOptionalUser(
	request: Request,
): Promise<LasiusSessionData | null> {
	const result = await getSessionTokens(request)
	return result?.tokens ?? null
}

/**
 * Require an authenticated user session. Redirects to /login if no valid session exists.
 * Use in loaders/actions that need authentication.
 */
export async function requireUser(
	request: Request,
): Promise<LasiusSessionData> {
	const result = await getSessionTokens(request)

	if (!result) {
		const url = new URL(request.url)
		throw redirect(`/login?returnTo=${encodeURIComponent(url.pathname)}`)
	}

	return result.tokens
}
