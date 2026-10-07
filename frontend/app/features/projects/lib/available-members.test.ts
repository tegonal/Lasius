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

import { getMemberListView, selectAvailableMembers } from './available-members'

const user = (id: string, firstName: string, lastName: string): ModelsUserStub => ({
  active: true,
  email: `${id}@lasius.ch`,
  firstName,
  id,
  key: id,
  lastName,
  role: 'FreeUser',
})

const anna = user('u1', 'Anna', 'Muster')
const bert = user('u2', 'Bert', 'Muster')
const carl = user('u3', 'Carl', 'Abegg')
const dora = user('u4', 'Dora', 'Zingg')

describe('selectAvailableMembers', () => {
  it('sorts by last name, then by first name', () => {
    const result = selectAvailableMembers([dora, bert, anna, carl], new Set(), new Set())
    expect(result.map((u) => u.id)).toEqual(['u3', 'u1', 'u2', 'u4'])
  })

  it('excludes project members and users added in this session', () => {
    const result = selectAvailableMembers(
      [anna, bert, carl, dora],
      new Set(['u1']),
      new Set(['u4']),
    )
    expect(result.map((u) => u.id)).toEqual(['u3', 'u2'])
  })

  it('returns an empty list when every user is excluded', () => {
    expect(selectAvailableMembers([anna], new Set(['u1']), new Set())).toEqual([])
    expect(selectAvailableMembers([], new Set(), new Set())).toEqual([])
  })

  it('does not change the input array', () => {
    const input = [dora, anna]
    selectAvailableMembers(input, new Set(), new Set())
    expect(input).toEqual([dora, anna])
  })
})

describe('getMemberListView', () => {
  it('shows the spinner while the list loads, whatever the count', () => {
    expect(getMemberListView(true, 0)).toBe('loading')
    expect(getMemberListView(true, 3)).toBe('loading')
  })

  it('shows the empty message without members and the list with members', () => {
    expect(getMemberListView(false, 0)).toBe('empty')
    expect(getMemberListView(false, 1)).toBe('list')
  })
})
