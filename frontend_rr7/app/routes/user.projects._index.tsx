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
  getProjectLastActivityDate,
  getProjectList,
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

  // Fetch last activity dates for all projects in parallel
  const lastActivityResults = await Promise.allSettled(
    projects.map((p) =>
      getProjectLastActivityDate(selectedOrgId, p.id, { headers }),
    ),
  )
  const lastActivityDates: Record<string, null | string> = {}
  projects.forEach((project, i) => {
    const result = lastActivityResults[i]
    lastActivityDates[project.id] =
      result?.status === 'fulfilled' && result.value?.status === 200
        ? result.value.data
        : null
  })

  return data(
    {
      lastActivityDates,
      selectedOrgId,
    },
    { headers: mergeAuthHeaders(auth) },
  )
}

export default function ProjectsIndex() {
  return <MyProjectsLayout />
}
