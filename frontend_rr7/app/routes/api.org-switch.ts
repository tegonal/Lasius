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

import { updateUserSettings } from '~/services/api/lasius/user/user'
import {
	authHeadersWithCsrf,
	mergeAuthHeaders,
	requireUser,
} from '~/services/auth/auth-helpers.server'

/**
 * POST /api/org-switch
 *
 * Resource route action that persists the selected organisation to user settings.
 * Called by the org switcher modal via useFetcher POST.
 */
export async function action({ request }: { request: Request }) {
	const auth = await requireUser(request)
	const formData = await request.formData()
	const orgId = formData.get('organisationId')
	const orgKey = formData.get('organisationKey')

	if (!orgId || !orgKey) {
		return data(
			{ error: 'Missing organisationId or organisationKey' },
			{ headers: mergeAuthHeaders(auth), status: 400 },
		)
	}

	const headers = await authHeadersWithCsrf(auth.session)
	const result = await updateUserSettings(
		{
			lastSelectedOrganisation: {
				id: orgId as string,
				key: orgKey as string,
			},
		},
		{ headers },
	)

	return data({ user: result.data }, { headers: mergeAuthHeaders(auth) })
}
