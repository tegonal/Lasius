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

import { data } from 'react-router'

import { getSessionTokens } from '~/services/auth/session.server'

/**
 * GET /api/session-status
 *
 * Polled by the client-side TokenWatcher. Calls getSessionTokens() which
 * auto-refreshes the access token if it's near expiry. The refreshed session
 * cookie is propagated back via Set-Cookie header.
 */
export async function loader({ request }: { request: Request }) {
	const result = await getSessionTokens(request)

	if (!result) {
		return data(
			{ authenticated: false, expiresAt: null },
			{ headers: { 'Cache-Control': 'no-store' } },
		)
	}

	const headers = new Headers({ 'Cache-Control': 'no-store' })
	if (result.headers) {
		const setCookie =
			result.headers instanceof Headers
				? result.headers.get('Set-Cookie')
				: (result.headers as Record<string, string>)['Set-Cookie']
		if (setCookie) {
			headers.set('Set-Cookie', setCookie)
		}
	}

	return data(
		{ authenticated: true, expiresAt: result.tokens.expiresAt },
		{ headers },
	)
}
