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
import { loadLastActivityDates } from '~/features/projects/last-activity.server'
import { loadOrganisationContext } from '~/lib/organisation-helpers.server'
import { mergeAuthHeaders } from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/user.projects._index'

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const { auth, headers, selectedOrgId } = await loadOrganisationContext(request, url)

  const lastActivityDates = await loadLastActivityDates(selectedOrgId, headers)

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
