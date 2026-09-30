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

import { loginUrl, returnToFromCallbackUrl } from '~/services/auth/auth-urls'

import { type Route } from './+types/legacy.api-auth'

/**
 * Lasius 2.x ran NextAuth under /api/auth/. An old link, a sign-out form or a provider callback that
 * still points there starts a new sign-in.
 */
export function action({ url }: Route.ActionArgs) {
  return redirectToLogin(url)
}

export function loader({ url }: Route.LoaderArgs) {
  return redirectToLogin(url)
}

function redirectToLogin(url: URL) {
  const returnTo = returnToFromCallbackUrl(url.searchParams.get('callbackUrl'))
  return redirect(loginUrl({ returnTo }))
}
