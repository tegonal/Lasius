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

import { createWsTicket } from '~/services/api/lasius/auth/auth'
import {
  authHeadersWithCsrf,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/api.ws-ticket'

/**
 * GET /api/ws-ticket
 *
 * Server-side route that exchanges the user's session token for a short-lived,
 * single-use WebSocket authentication ticket. The real access token never
 * reaches the browser — only the ticket does.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const auth = await requireUser(request)
  const headers = await authHeadersWithCsrf(auth.session)
  const response = await createWsTicket({ headers })
  const ticket =
    response.data && 'ticket' in response.data
      ? (response.data.ticket ?? null)
      : null
  return data({ ticket }, { headers: mergeAuthHeaders(auth) })
}
