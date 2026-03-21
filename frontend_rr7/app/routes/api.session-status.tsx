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

import { getUserSession } from '~/services/auth/session.server'

/**
 * GET /api/session-status
 *
 * Lightweight endpoint polled by the client-side TokenWatcher.
 * Returns session status without triggering auto-refresh — that happens
 * transparently in loaders via getSessionTokens().
 */
export async function loader({ request }: { request: Request }) {
	const session = await getUserSession(request)
	const user = session.get('user')

	const authenticated = !!user
	const expiresAt = user?.expiresAt ?? null

	return data(
		{ authenticated, expiresAt },
		{
			headers: {
				'Cache-Control': 'no-store',
			},
		},
	)
}
