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

import { getOrganisationState, selectOrganisation } from '~/lib/organisation-selection'
import { type ModelsUserOrganisation } from '~/services/api/lasius/modelsUserOrganisation'
import { ModelsUserOrganisationRole } from '~/services/api/lasius/modelsUserOrganisationRole'
import { type ModelsUserSettings } from '~/services/api/lasius/modelsUserSettings'

describe('getOrganisationState', () => {
  it('gives empty values without a user', () => {
    expect(getOrganisationState(undefined)).toEqual({
      isAdministrator: false,
      organisations: [],
      selectedOrganisation: undefined,
      selectedOrganisationId: '',
      selectedOrganisationKey: '',
    })
  })

  it('gives the id, the key and the admin flag of the selected organisation', () => {
    const team: ModelsUserOrganisation = {
      ...org('team'),
      role: ModelsUserOrganisationRole.OrganisationAdministrator,
    }
    const user = userWith([org('private', true), team], 'team')
    expect(getOrganisationState(user)).toMatchObject({
      isAdministrator: true,
      organisations: user.organisations,
      selectedOrganisation: team,
      selectedOrganisationId: 'team',
      selectedOrganisationKey: 'team',
    })
  })

  it('gives no admin flag for a member', () => {
    const user = userWith([{ ...org('team'), role: ModelsUserOrganisationRole.OrganisationMember }])
    expect(getOrganisationState(user).isAdministrator).toBe(false)
  })
})

const org = (id: string, isPrivate = false) =>
  ({
    organisationReference: { id, key: id },
    private: isPrivate,
    projects: [],
  }) as unknown as ModelsUserOrganisation

const userWith = (organisations: ModelsUserOrganisation[], lastSelectedId?: string) => {
  const settings: Partial<ModelsUserSettings> = {
    lastSelectedOrganisation: lastSelectedId
      ? { id: lastSelectedId, key: lastSelectedId }
      : undefined,
  }
  return { organisations, settings: settings as ModelsUserSettings }
}

describe('selectOrganisation', () => {
  it('returns the last selected organisation when the user is a member', () => {
    const user = userWith([org('private', true), org('team')], 'team')
    expect(selectOrganisation(user)?.organisationReference.id).toBe('team')
  })

  it('ignores a last selected organisation that the user no longer belongs to', () => {
    const user = userWith([org('team'), org('private', true)], 'removed')
    expect(selectOrganisation(user)?.organisationReference.id).toBe('private')
  })

  it('falls back to the first organisation without a private one', () => {
    const user = userWith([org('a'), org('b')])
    expect(selectOrganisation(user)?.organisationReference.id).toBe('a')
  })

  it('returns undefined without organisations or without a user', () => {
    expect(selectOrganisation(userWith([]))).toBeUndefined()
    expect(selectOrganisation(undefined)).toBeUndefined()
  })
})
