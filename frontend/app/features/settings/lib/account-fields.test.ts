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

import { getAccountFields } from './account-fields'

describe('getAccountFields', () => {
  it('takes the fields of the user', () => {
    expect(
      getAccountFields({
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'FreeUser',
      }),
    ).toEqual({ email: 'jane@example.com', firstName: 'Jane', lastName: 'Doe', role: 'FreeUser' })
  })

  it('gives empty strings without a user or for missing fields', () => {
    const empty = { email: '', firstName: '', lastName: '', role: '' }
    expect(getAccountFields(undefined)).toEqual(empty)
    expect(getAccountFields(null)).toEqual(empty)
    expect(getAccountFields({ email: null, role: '' })).toEqual(empty)
  })
})
