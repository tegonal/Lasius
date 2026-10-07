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

import { resolveAvatarName } from './resolve-avatar-name'

describe('resolveAvatarName', () => {
  it('uses the names of the user stub', () => {
    expect(resolveAvatarName('jane.doe', { firstName: 'Jane', lastName: 'Doe' })).toEqual({
      firstName: 'Jane',
      lastName: 'Doe',
    })
  })

  it('splits the user key at the first dot without a user stub', () => {
    expect(resolveAvatarName('jane.doe', undefined)).toEqual({ firstName: 'jane', lastName: 'doe' })
    expect(resolveAvatarName('jane.van.doe', undefined)).toEqual({
      firstName: 'jane',
      lastName: 'van',
    })
  })

  it('fills only the empty names of the user stub from the key', () => {
    expect(resolveAvatarName('jane.doe', { firstName: '', lastName: 'Doe' })).toEqual({
      firstName: 'jane',
      lastName: 'Doe',
    })
  })

  it('uses the second letter as last name for a key without a dot', () => {
    expect(resolveAvatarName('jdoe', undefined)).toEqual({ firstName: 'jdoe', lastName: 'd' })
  })

  it('uses the letters of the key when the part before the dot is empty', () => {
    expect(resolveAvatarName('.x', undefined)).toEqual({ firstName: '.', lastName: 'x' })
  })

  it('returns empty names for an empty key', () => {
    expect(resolveAvatarName('', undefined)).toEqual({ firstName: '', lastName: '' })
  })
})
