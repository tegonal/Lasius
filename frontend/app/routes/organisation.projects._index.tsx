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

import { data, redirect } from 'react-router'

import { AllProjectsLayout } from '~/features/projects/components/all-projects-layout'
import { loadLastActivityDates } from '~/features/projects/last-activity.server'
import { loadOrganisationContext } from '~/lib/organisation-helpers.server'
import { getProjectList } from '~/services/api/lasius/projects/projects'
import { mergeAuthHeaders } from '~/services/auth/auth-helpers.server'
import { type ProjectWithActivity } from '~/types/common'

import { type Route } from './+types/organisation.projects._index'

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const { auth, headers, isOrganisationAdmin, selectedOrgId } = await loadOrganisationContext(
    request,
    url,
  )

  // Admin guard: only organisation administrators can access this page
  if (!isOrganisationAdmin) {
    throw redirect('/user/home', { headers: mergeAuthHeaders(auth) })
  }

  const [projectsResponse, lastActivityDates] = await Promise.all([
    getProjectList(selectedOrgId, { headers }),
    loadLastActivityDates(selectedOrgId, headers),
  ])
  const projectsWithActivity: ProjectWithActivity[] = (projectsResponse.data ?? []).map(
    (project) => ({ ...project, lastActivityDate: lastActivityDates[project.id] ?? null }),
  )

  return data(
    {
      projects: projectsWithActivity,
      selectedOrgId,
    },
    { headers: mergeAuthHeaders(auth) },
  )
}

export default function OrganisationProjectsIndex() {
  return <AllProjectsLayout />
}
