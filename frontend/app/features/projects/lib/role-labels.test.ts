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

import { getDefaultRole, getRoleLabel, getRoleOptions } from './role-labels'

const t = (key: string, options: string | { defaultValue: string }) =>
  `${key}|${typeof options === 'string' ? options : options.defaultValue}`

describe('getRoleLabel', () => {
  it('uses the shared administrator key for both administrator roles', () => {
    expect(getRoleLabel('ProjectAdministrator', t)).toBe('common:roles.administrator|Administrator')
    expect(getRoleLabel('OrganisationAdministrator', t)).toBe(
      'common:roles.administrator|Administrator',
    )
  })

  it('uses the shared member key for both member roles', () => {
    expect(getRoleLabel('ProjectMember', t)).toBe('common:roles.member|Member')
    expect(getRoleLabel('OrganisationMember', t)).toBe('common:roles.member|Member')
  })
})

describe('getRoleOptions', () => {
  it('lists the member role first, then the administrator role of the scope', () => {
    expect(getRoleOptions('project', t)).toEqual([
      { label: 'common:roles.member|Member', value: 'ProjectMember' },
      { label: 'common:roles.administrator|Administrator', value: 'ProjectAdministrator' },
    ])
    expect(getRoleOptions('organisation', t).map((option) => option.value)).toEqual([
      'OrganisationMember',
      'OrganisationAdministrator',
    ])
  })
})

describe('getDefaultRole', () => {
  it('returns the member role of the scope', () => {
    expect(getDefaultRole('project')).toBe('ProjectMember')
    expect(getDefaultRole('organisation')).toBe('OrganisationMember')
  })
})
