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

import { mergeErrors } from './conform-helpers'

describe('mergeErrors', () => {
  it('returns undefined when both inputs are undefined', () => {
    expect(mergeErrors()).toBeUndefined()
  })

  it('returns undefined when both inputs are empty arrays', () => {
    expect(mergeErrors([], [])).toBeUndefined()
  })

  it('returns conform errors when server errors are undefined', () => {
    expect(mergeErrors(['Required'])).toEqual(['Required'])
  })

  it('returns server errors when conform errors are undefined', () => {
    expect(mergeErrors(undefined, ['Already exists'])).toEqual([
      'Already exists',
    ])
  })

  it('merges both error arrays', () => {
    expect(mergeErrors(['Required'], ['Already exists'])).toEqual([
      'Required',
      'Already exists',
    ])
  })

  it('returns conform errors when server errors are empty', () => {
    expect(mergeErrors(['Required'], [])).toEqual(['Required'])
  })
})
