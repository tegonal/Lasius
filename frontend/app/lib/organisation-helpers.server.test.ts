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

import { type ModelsUser, type ModelsUserOrganisation } from '~/services/api/lasius'
import { ModelsUserOrganisationRole } from '~/services/api/lasius/modelsUserOrganisationRole'
import { ModelsUserRole } from '~/services/api/lasius/modelsUserRole'

import { getSelectedOrganisationId } from './organisation-helpers.server'

const organisation = (id: string, isPrivate = false): ModelsUserOrganisation => ({
  organisationReference: { id, key: id },
  plannedWorkingHours: {
    friday: 0,
    monday: 0,
    saturday: 0,
    sunday: 0,
    thursday: 0,
    tuesday: 0,
    wednesday: 0,
  },
  private: isPrivate,
  projects: [],
  role: ModelsUserOrganisationRole.OrganisationMember,
})

const user = (organisations: ModelsUserOrganisation[], lastSelectedId?: string): ModelsUser => ({
  active: true,
  email: 'jane@example.com',
  firstName: 'Jane',
  id: 'u-1',
  key: 'jane',
  lastName: 'Doe',
  organisations,
  role: ModelsUserRole.FreeUser,
  settings: lastSelectedId ? { lastSelectedOrganisation: { id: lastSelectedId, key: 'x' } } : {},
})

describe('getSelectedOrganisationId', () => {
  it('selects the last selected organisation when the user belongs to it', () => {
    const organisations = [organisation('private', true), organisation('team')]

    expect(getSelectedOrganisationId(user(organisations, 'team'))).toBe('team')
  })

  it('ignores a last selected organisation that the user no longer belongs to', () => {
    const organisations = [organisation('team'), organisation('private', true)]

    expect(getSelectedOrganisationId(user(organisations, 'removed'))).toBe('private')
  })

  it('selects the private organisation without a last selection', () => {
    const organisations = [organisation('team'), organisation('private', true)]

    expect(getSelectedOrganisationId(user(organisations))).toBe('private')
  })

  it('selects the first organisation without a private organisation', () => {
    const organisations = [organisation('first'), organisation('second')]

    expect(getSelectedOrganisationId(user(organisations, 'removed'))).toBe('first')
  })

  it('returns an empty string without organisations', () => {
    expect(getSelectedOrganisationId(user([], 'removed'))).toBe('')
  })
})
