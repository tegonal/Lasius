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

import { mergeAuthHeaders, requireUser } from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/index-redirect'

// Matches Next.js index page: / → /user/home
export async function loader({ request, url }: Route.LoaderArgs) {
  // A thrown redirect drops the refreshed cookie of the layout loader (pitfalls/rr7-propagate-auth-headers).
  const auth = await requireUser(request, url)
  throw redirect('/user/home', { headers: mergeAuthHeaders(auth) })
}
