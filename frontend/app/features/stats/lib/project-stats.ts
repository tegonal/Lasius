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

import {
  type ModelsBooking,
  type ModelsUserOrganisation,
  type ModelsUserProject,
} from '~/services/api/lasius'
import { type ModelsEntityReference } from '~/services/api/lasius/modelsEntityReference'
import { ModelsUserProjectRole } from '~/services/api/lasius/modelsUserProjectRole'

export type ProjectStatsScope = 'organisation' | 'user'

export type ProjectStatsView = 'tags' | 'users'

export type StatsProject = ModelsEntityReference

export const getProjectStatsView = (searchParameters: URLSearchParams): ProjectStatsView =>
  searchParameters.get('view') === 'users' ? 'users' : 'tags'

export const getStatsSource = (view: ProjectStatsView): 'tag' | 'user' =>
  view === 'users' ? 'user' : 'tag'

export const countDistinctUsers = (bookings: ModelsBooking[]): number =>
  new Set(bookings.map((booking) => booking.userReference.id)).size

// The aggregated statistics endpoint accepts only a project administrator, also for an organisation administrator.
export const findAdministeredProject = (
  userProjects: ModelsUserProject[],
  projectId: string,
): null | StatsProject => {
  const project = userProjects.find(
    (candidate) =>
      candidate.projectReference.id === projectId &&
      candidate.role === ModelsUserProjectRole.ProjectAdministrator,
  )
  return project ? project.projectReference : null
}

export const findProjectInProfile = (
  organisations: ModelsUserOrganisation[],
  orgId: string,
  projectId: string,
): null | StatsProject => {
  const organisation = organisations.find(
    (candidate) => candidate.organisationReference.id === orgId,
  )
  return findAdministeredProject(organisation?.projects ?? [], projectId)
}

export const getProjectsPath = (scope: ProjectStatsScope): string =>
  scope === 'organisation' ? '/organisation/projects' : '/user/projects'

export const getProjectStatsPath = (scope: ProjectStatsScope, projectId: string): string =>
  `/${scope}/stats/project/${projectId}`
