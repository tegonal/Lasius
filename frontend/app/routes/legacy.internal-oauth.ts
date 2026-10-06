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

import {
  internalLoginUrl,
  internalRegisterUrl,
  returnToFromCallbackUrl,
} from '~/services/auth/auth-urls'

import { type Route } from './+types/legacy.internal-oauth'

/** Lasius 2.x served the internal sign-in pages under /internal_oauth/. */
export function loader({ params, url }: Route.LoaderArgs) {
  const search = url.searchParams
  const email = search.get('email') ?? undefined
  const invitationId = search.get('invitation_id') ?? undefined
  const returnTo = returnToFromCallbackUrl(search.get('callbackUrl'))

  if (params['*'] === 'register') {
    return redirect(internalRegisterUrl({ email, invitation_id: invitationId, returnTo }), 301)
  }

  return redirect(
    internalLoginUrl({
      email,
      invitation_id: invitationId,
      registered: search.get('registered') === 'true',
      returnTo,
    }),
    301,
  )
}
