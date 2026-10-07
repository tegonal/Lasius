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

import { getResourceOwnerPlaceholderState } from './resource-owner-placeholder'

describe('getResourceOwnerPlaceholderState', () => {
  it('reports loading first, even with owners and a token', () => {
    expect(
      getResourceOwnerPlaceholderState({ hasAccessToken: true, isLoading: true, ownerCount: 3 }),
    ).toBe('loading')
  })

  it('asks for a token when there are no owners and no token', () => {
    expect(
      getResourceOwnerPlaceholderState({ hasAccessToken: false, isLoading: false, ownerCount: 0 }),
    ).toBe('needsToken')
  })

  it('reports no results when a token gives no owners', () => {
    expect(
      getResourceOwnerPlaceholderState({ hasAccessToken: true, isLoading: false, ownerCount: 0 }),
    ).toBe('empty')
  })

  it('asks for a selection when owners exist, with or without a token', () => {
    expect(
      getResourceOwnerPlaceholderState({ hasAccessToken: true, isLoading: false, ownerCount: 2 }),
    ).toBe('select')
    expect(
      getResourceOwnerPlaceholderState({ hasAccessToken: false, isLoading: false, ownerCount: 2 }),
    ).toBe('select')
  })
})
