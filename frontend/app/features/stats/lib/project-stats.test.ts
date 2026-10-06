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

import { describe, expect, it } from 'vitest'

import { type ModelsBooking, type ModelsUserOrganisation } from '~/services/api/lasius'

import {
  countDistinctUsers,
  findAdministeredProject,
  findProjectInProfile,
  getProjectsPath,
  getProjectStatsPath,
  getProjectStatsView,
  getStatsSource,
} from './project-stats'

const organisations = [
  {
    organisationReference: { id: 'org-1', key: 'DemoOrg' },
    projects: [
      { projectReference: { id: 'p-1', key: 'Lasius' }, role: 'ProjectAdministrator' },
      { projectReference: { id: 'p-2', key: 'Docs' }, role: 'ProjectMember' },
    ],
    role: 'OrganisationMember',
  },
  {
    organisationReference: { id: 'org-2', key: 'OtherOrg' },
    projects: [{ projectReference: { id: 'p-3', key: 'Shop' }, role: 'ProjectMember' }],
    role: 'OrganisationAdministrator',
  },
] as unknown as ModelsUserOrganisation[]

describe('getProjectStatsView', () => {
  it('shows the user view only for view=users', () => {
    expect(getProjectStatsView(new URLSearchParams('view=users'))).toBe('users')
  })

  it('falls back to the tag view', () => {
    expect(getProjectStatsView(new URLSearchParams(''))).toBe('tags')
    expect(getProjectStatsView(new URLSearchParams('view=projects'))).toBe('tags')
  })
})

describe('getStatsSource', () => {
  it('maps the view to the API source', () => {
    expect(getStatsSource('users')).toBe('user')
    expect(getStatsSource('tags')).toBe('tag')
  })
})

describe('countDistinctUsers', () => {
  it('counts each user once', () => {
    const bookings = [
      { userReference: { id: 'u-1', key: 'a' } },
      { userReference: { id: 'u-1', key: 'a' } },
      { userReference: { id: 'u-2', key: 'b' } },
    ] as unknown as ModelsBooking[]
    expect(countDistinctUsers(bookings)).toBe(2)
  })
})

describe('findAdministeredProject', () => {
  it('returns the reference of an administered project', () => {
    expect(findAdministeredProject(organisations[0]?.projects ?? [], 'p-1')).toEqual({
      id: 'p-1',
      key: 'Lasius',
    })
  })

  it('returns null for a plain project member', () => {
    expect(findAdministeredProject(organisations[0]?.projects ?? [], 'p-2')).toBeNull()
  })
})

describe('findProjectInProfile', () => {
  it('returns an administered project of the selected organisation', () => {
    expect(findProjectInProfile(organisations, 'org-1', 'p-1')).toEqual({
      id: 'p-1',
      key: 'Lasius',
    })
  })

  it('returns null for an organisation administrator without the project role', () => {
    expect(findProjectInProfile(organisations, 'org-2', 'p-3')).toBeNull()
  })

  it('returns null for a project of another organisation', () => {
    expect(findProjectInProfile(organisations, 'org-2', 'p-1')).toBeNull()
  })
})

describe('paths', () => {
  it('builds the project list and the project stats paths per scope', () => {
    expect(getProjectsPath('organisation')).toBe('/organisation/projects')
    expect(getProjectsPath('user')).toBe('/user/projects')
    expect(getProjectStatsPath('user', 'p-1')).toBe('/user/stats/project/p-1')
  })
})
