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

import { type DateOption } from '~/lib/utils/date/date-options'

import {
  getFilterDefaults,
  getFilterResetValues,
  hasFilterChanges,
  projectsPathFor,
} from './booking-history-filter-state'

const option: DateOption = {
  dateRangeFn: (day) => ({ from: `from-${day.getTime()}`, to: `to-${day.getTime()}` }),
  label: () => 'Yesterday',
  name: 'Yesterday',
}

const defaults = getFilterDefaults(option)
const unchanged = { dateRange: 'Yesterday', projectId: '', tags: '', userId: '' }

describe('getFilterDefaults', () => {
  it('uses the name of the first date option as the date range', () => {
    expect(getFilterDefaults(option)).toEqual({ dateRange: 'Yesterday', projectId: '', userId: '' })
  })

  it('falls back to an empty date range without a date option', () => {
    expect(getFilterDefaults(undefined).dateRange).toBe('')
  })
})

describe('hasFilterChanges', () => {
  it('returns false for the default values', () => {
    expect(hasFilterChanges(unchanged, defaults)).toBe(false)
  })

  it('treats undefined values as empty strings', () => {
    const values = {
      dateRange: undefined,
      projectId: undefined,
      tags: undefined,
      userId: undefined,
    }
    expect(hasFilterChanges(values, getFilterDefaults(undefined))).toBe(false)
    expect(hasFilterChanges(values, defaults)).toBe(true)
  })

  it('returns true when one filter differs from its default', () => {
    expect(hasFilterChanges({ ...unchanged, projectId: 'p1' }, defaults)).toBe(true)
    expect(hasFilterChanges({ ...unchanged, userId: 'u1' }, defaults)).toBe(true)
    expect(hasFilterChanges({ ...unchanged, tags: 'tag' }, defaults)).toBe(true)
    expect(hasFilterChanges({ ...unchanged, dateRange: 'This week' }, defaults)).toBe(true)
  })
})

describe('getFilterResetValues', () => {
  it('returns the defaults, empty tags and the range of the first date option', () => {
    const now = new Date(1000)
    expect(getFilterResetValues(option, now)).toEqual({
      dateRange: 'Yesterday',
      projectId: '',
      range: { from: 'from-1000', to: 'to-1000' },
      tags: '',
      userId: '',
    })
  })

  it('returns no range without a date option', () => {
    expect(getFilterResetValues(undefined, new Date()).range).toBeNull()
  })
})

describe('projectsPathFor', () => {
  it('returns the projects page of the data source', () => {
    expect(projectsPathFor('userBookings')).toBe('/user/projects')
    expect(projectsPathFor('organisationBookings')).toBe('/organisation/projects')
  })
})
