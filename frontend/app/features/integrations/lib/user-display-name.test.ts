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

import { type ModelsUserStub } from '~/services/api/lasius'

import { getUserDisplayName } from './user-display-name'

const user = (overrides: Partial<ModelsUserStub>): ModelsUserStub => ({
  active: true,
  email: 'li.wu@example.com',
  firstName: 'Li',
  id: 'user-1',
  key: 'li.wu',
  lastName: 'Wu',
  role: 'FreeUser',
  ...overrides,
})

describe('getUserDisplayName', () => {
  it('returns the first and the last name', () => {
    expect(getUserDisplayName(user({}))).toBe('Li Wu')
  })

  it('returns the name part that exists', () => {
    expect(getUserDisplayName(user({ lastName: '' }))).toBe('Li')
  })

  it('falls back to the email when both names are empty', () => {
    expect(getUserDisplayName(user({ firstName: '', lastName: '' }))).toBe('li.wu@example.com')
  })

  it('falls back to the key when the names and the email are empty', () => {
    expect(getUserDisplayName(user({ email: '', firstName: '', lastName: '' }))).toBe('li.wu')
  })
})
