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

import { type ModelsBookingStats } from '~/services/api/lasius'

import { getTransformedChartDataAggregate } from './get-transformed-chart-data-aggregate'

const HOUR = 60 * 60 * 1000

const stats = (values: ModelsBookingStats['values']): ModelsBookingStats[] => [
  { category: {}, values },
]

const threeProjects = stats([
  { duration: 2 * HOUR, label: 'b' },
  { duration: 5 * HOUR, label: 'c' },
  { duration: 1 * HOUR, label: 'a' },
])

describe('getTransformedChartDataAggregate', () => {
  it('returns no data for undefined input', () => {
    expect(getTransformedChartDataAggregate(undefined)).toEqual({ data: undefined })
  })

  it('returns no data for an empty list and for a category without values', () => {
    expect(getTransformedChartDataAggregate([])).toEqual({ data: undefined })
    expect(getTransformedChartDataAggregate(stats([]))).toEqual({ data: undefined })
  })

  it('drops zero and missing durations from the data', () => {
    const result = getTransformedChartDataAggregate(
      stats([
        { duration: 0, label: 'zero' },
        { duration: null, label: 'none' },
        { duration: HOUR, label: null },
      ]),
    )
    expect(result.data).toEqual([{ id: '', value: 1 }])
  })

  it('sorts the data by value, smallest first', () => {
    expect(getTransformedChartDataAggregate(threeProjects).data).toEqual([
      { id: 'a', value: 1 },
      { id: 'b', value: 2 },
      { id: 'c', value: 5 },
    ])
  })

  it.each([-1, 0])('returns every entry for the limit %i', (limit) => {
    expect(getTransformedChartDataAggregate(threeProjects, limit).data).toHaveLength(3)
  })

  it('returns the largest entries for a limit below the length', () => {
    expect(getTransformedChartDataAggregate(threeProjects, 2).data).toEqual([
      { id: 'b', value: 2 },
      { id: 'c', value: 5 },
    ])
  })

  it('returns every entry for a limit above the length', () => {
    expect(getTransformedChartDataAggregate(threeProjects, 10).data).toHaveLength(3)
  })

  it('returns the raw labels as keys, including labels that the data drops', () => {
    const result = getTransformedChartDataAggregate(
      stats([
        { duration: 0, label: 'zero' },
        { duration: HOUR, label: 'one' },
      ]),
    )
    expect(result.keys).toEqual(['zero', 'one'])
  })
})
