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

import {
  applyFilterParameters,
  areFilterValuesEqual,
  type FilterUrlValues,
  orEmpty,
  parseTagsParameter,
} from '~/features/booking-history/lib/booking-history-search-parameters'

const values: FilterUrlValues = {
  from: '2026-10-06T00:00:00.000+02:00',
  projectId: 'p1',
  tags: '[{"id":"t1","type":"SimpleTag"}]',
  to: '2026-10-06T23:59:59.999+02:00',
  userId: 'u1',
}

describe('applyFilterParameters', () => {
  it('sets every value and keeps unrelated keys', () => {
    const parameters = applyFilterParameters(new URLSearchParams('date=2026-09-28'), values)
    expect(parameters.get('from')).toBe(values.from)
    expect(parameters.get('to')).toBe(values.to)
    expect(parameters.get('projectId')).toBe('p1')
    expect(parameters.get('userId')).toBe('u1')
    expect(parameters.get('tags')).toBe(values.tags)
    expect(parameters.get('date')).toBe('2026-09-28')
  })

  it('removes an empty project, user and tag value', () => {
    const parameters = applyFilterParameters(new URLSearchParams('projectId=p1&userId=u1&tags=x'), {
      ...values,
      projectId: '',
      tags: '',
      userId: '',
    })
    expect(parameters.has('projectId')).toBe(false)
    expect(parameters.has('userId')).toBe(false)
    expect(parameters.has('tags')).toBe(false)
  })
})

describe('areFilterValuesEqual', () => {
  it('is true for the same values', () => {
    expect(areFilterValuesEqual(values, { ...values })).toBe(true)
  })

  it.each(['from', 'to', 'projectId', 'userId', 'tags'] as const)(
    'is false when %s differs',
    (key) => {
      expect(areFilterValuesEqual(values, { ...values, [key]: 'other' })).toBe(false)
    },
  )
})

describe('orEmpty', () => {
  it('keeps a string and turns null and undefined into an empty string', () => {
    expect(orEmpty('a')).toBe('a')
    expect(orEmpty(null)).toBe('')
    expect(orEmpty(undefined)).toBe('')
  })
})

describe('parseTagsParameter', () => {
  it('parses a JSON tag list', () => {
    expect(parseTagsParameter(values.tags)).toEqual([{ id: 't1', type: 'SimpleTag' }])
  })

  it('gives no tags for an empty or invalid value', () => {
    expect(parseTagsParameter('')).toEqual([])
    expect(parseTagsParameter('{not json')).toEqual([])
  })
})
