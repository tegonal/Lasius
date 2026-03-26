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

import { logger } from '~/lib/logger'
import { getProvider } from '~/services/auth/providers'
import {
  destroyUserSession,
  getSessionTokens,
} from '~/services/auth/session.server'

import { type Route } from './+types/logout'

/** Handle POST logout (preferred — form submission) */
export async function action({ request }: Route.ActionArgs) {
  return performLogout(request)
}

/** GET /logout also destroys the session — users visiting /logout directly expect to be logged out */
export async function loader({ request }: Route.LoaderArgs) {
  return performLogout(request)
}

/**
 * This route processes logout and redirects.
 * No component is normally rendered, but we include one as a fallback.
 */
export default function Logout() {
  return null
}

async function performLogout(request: Request): Promise<Response> {
  const result = await getSessionTokens(request)

  if (result?.tokens) {
    try {
      const provider = getProvider(result.tokens.tokenIssuer)
      await provider.revokeToken(result.tokens.refreshToken)
      logger.debug('Token revoked successfully', {
        provider: result.tokens.tokenIssuer,
      })
    } catch (error) {
      logger.warn('Token revocation failed during logout', { error: error })
    }
  }

  return destroyUserSession(request)
}
