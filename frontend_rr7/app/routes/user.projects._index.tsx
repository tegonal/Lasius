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

import { MyProjectsLayout } from '~/features/projects/components/my-projects-layout'
import {
	createProject,
	getProjectList,
	updateProject,
} from '~/services/api/lasius/projects/projects'
import { getUserProfile } from '~/services/api/lasius/user/user'
import {
	authHeaders,
	mergeAuthHeaders,
	requireUser,
} from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/user.projects._index'

export const loader = async ({ request }: Route.LoaderArgs) => {
	const auth = await requireUser(request)
	const headers = authHeaders(auth.session)

	// Get user profile for org selection
	const profile = await getUserProfile({ headers })
	const user = profile.data
	const organisations = user.organisations ?? []
	const selectedOrgId =
		user.settings?.lastSelectedOrganisation?.id ??
		organisations.find((o) => o.private)?.organisationReference.id ??
		organisations[0]?.organisationReference.id ??
		''

	// Fetch projects for selected org
	const projectsRes = await getProjectList(selectedOrgId, { headers })
	const projects = projectsRes.data ?? []

	return data(
		{
			projects,
			selectedOrgId,
		},
		{ headers: mergeAuthHeaders(auth) },
	)
}

export const action = async ({ request }: Route.ActionArgs) => {
	const auth = await requireUser(request)
	const headers = authHeaders(auth.session)

	const formData = await request.formData()
	const intent = formData.get('intent')

	// Get selected org ID
	const profile = await getUserProfile({ headers })
	const user = profile.data
	const organisations = user.organisations ?? []
	const selectedOrgId =
		user.settings?.lastSelectedOrganisation?.id ??
		organisations.find((o) => o.private)?.organisationReference.id ??
		organisations[0]?.organisationReference.id ??
		''

	if (intent === 'createProject') {
		const key = formData.get('key') as string
		await createProject(
			selectedOrgId,
			{ bookingCategories: [], key },
			{ headers },
		)
		return data({ ok: true }, { headers: mergeAuthHeaders(auth) })
	}

	if (intent === 'updateProject') {
		const projectId = formData.get('projectId') as string
		const key = formData.get('key') as string
		await updateProject(selectedOrgId, projectId, { key }, { headers })
		return data({ ok: true }, { headers: mergeAuthHeaders(auth) })
	}

	return data({ error: 'Unknown intent' }, { status: 400 })
}

export default function ProjectsIndex() {
	return <MyProjectsLayout />
}
