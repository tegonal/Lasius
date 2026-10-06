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

import { getStatsTabSearch } from './stats-tab-search'

describe('getStatsTabSearch', () => {
  it('keeps the date range and drops other params', () => {
    expect(getStatsTabSearch(new URLSearchParams('from=a&to=b&dateRange=Custom&view=users'))).toBe(
      '?from=a&to=b&dateRange=Custom',
    )
  })

  it('adds the tab params and replaces a current value', () => {
    expect(getStatsTabSearch(new URLSearchParams('from=a&view=tags'), { view: 'users' })).toBe(
      '?from=a&view=users',
    )
  })

  it('returns an empty string without params', () => {
    expect(getStatsTabSearch(new URLSearchParams(''))).toBe('')
  })
})
