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

import { IntegrationsLayout } from '~/features/integrations/components/integrations-layout'
import {
  getDeduplicatedUserProfile,
  getSelectedOrganisationId,
} from '~/lib/organisation-helpers.server'
import { getConfigs } from '~/services/api/lasius/issue-importers/issue-importers'
import { ModelsUserOrganisationRole } from '~/services/api/lasius/modelsUserOrganisationRole'
import { getProjectList } from '~/services/api/lasius/projects/projects'
import {
  authHeaders,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/organisation.integrations'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const auth = await requireUser(request)
  const headers = authHeaders(auth.session)

  const profile = await getDeduplicatedUserProfile({ headers })
  const user = profile.data
  const organisations = user.organisations ?? []
  const selectedOrgId = getSelectedOrganisationId(user)

  // Admin guard: only organisation administrators can access this page
  const selectedOrg = organisations.find(
    (o) => o.organisationReference.id === selectedOrgId,
  )
  if (
    selectedOrg?.role !== ModelsUserOrganisationRole.OrganisationAdministrator
  ) {
    throw redirect('/user/home')
  }

  // Fetch configs and projects in parallel
  const [configsRes, projectsRes] = await Promise.all([
    getConfigs(selectedOrgId, undefined, { headers }),
    getProjectList(selectedOrgId, { headers }),
  ])

  return data(
    {
      configs: configsRes.status === 200 ? configsRes.data : [],
      projects: projectsRes.status === 200 ? projectsRes.data : [],
      selectedOrgId,
    },
    { headers: mergeAuthHeaders(auth) },
  )
}

export default function OrganisationIntegrations() {
  return <IntegrationsLayout />
}
