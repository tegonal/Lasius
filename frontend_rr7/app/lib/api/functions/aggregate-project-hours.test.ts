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

import { MS_PER_HOUR } from '~/config/constants'

import { aggregateProjectHours } from './aggregate-project-hours'

interface StubBookingStats {
  category: object
  values: StubBookingStatsValue[]
}

interface StubBookingStatsValue {
  duration?: null | number
  label?: null | string
}

const makeStats = (values: StubBookingStatsValue[]): StubBookingStats => ({
  category: {},
  values,
})

describe('aggregateProjectHours', () => {
  it('returns empty array for undefined data', () => {
    expect(aggregateProjectHours()).toEqual([])
  })

  it('returns empty array for empty data', () => {
    expect(aggregateProjectHours([])).toEqual([])
  })

  it('handles a single project with one entry', () => {
    const data = [makeStats([{ duration: MS_PER_HOUR, label: 'Proj' }])]
    const result = aggregateProjectHours(data as any)
    expect(result).toEqual([{ hours: 1, name: 'Proj', percentage: 100 }])
  })

  it('sorts multiple projects by hours descending', () => {
    const data = [
      makeStats([
        { duration: MS_PER_HOUR, label: 'Small' },
        { duration: MS_PER_HOUR * 3, label: 'Big' },
        { duration: MS_PER_HOUR * 2, label: 'Medium' },
      ]),
    ]
    const result = aggregateProjectHours(data as any)
    expect(result[0]!.name).toBe('Big')
    expect(result[1]!.name).toBe('Medium')
    expect(result[2]!.name).toBe('Small')
  })

  it('calculates percentages that sum to 100', () => {
    const data = [
      makeStats([
        { duration: MS_PER_HOUR * 3, label: 'A' },
        { duration: MS_PER_HOUR * 1, label: 'B' },
      ]),
    ]
    const result = aggregateProjectHours(data as any)
    const totalPercentage = result.reduce((sum, r) => sum + r.percentage, 0)
    expect(totalPercentage).toBe(100)
    expect(result[0]!.percentage).toBe(75)
    expect(result[1]!.percentage).toBe(25)
  })

  it('aggregates same project across multiple stats entries', () => {
    const data = [
      makeStats([{ duration: MS_PER_HOUR, label: 'Proj' }]),
      makeStats([{ duration: MS_PER_HOUR * 2, label: 'Proj' }]),
    ]
    const result = aggregateProjectHours(data as any)
    expect(result).toEqual([{ hours: 3, name: 'Proj', percentage: 100 }])
  })

  it('limits results with topN and recalculates percentages', () => {
    const data = [
      makeStats([
        { duration: MS_PER_HOUR * 5, label: 'A' },
        { duration: MS_PER_HOUR * 3, label: 'B' },
        { duration: MS_PER_HOUR * 2, label: 'C' },
      ]),
    ]
    const result = aggregateProjectHours(data as any, 2)
    expect(result).toHaveLength(2)
    expect(result[0]!.name).toBe('A')
    expect(result[1]!.name).toBe('B')
    // Percentages recalculated for the slice (5+3=8 total)
    expect(result[0]!.percentage).toBeCloseTo(62.5)
    expect(result[1]!.percentage).toBeCloseTo(37.5)
  })

  it('skips entries with null labels', () => {
    const data = [
      makeStats([
        { duration: MS_PER_HOUR, label: null },
        { duration: MS_PER_HOUR, label: 'Valid' },
      ]),
    ]
    const result = aggregateProjectHours(data as any)
    expect(result).toHaveLength(1)
    expect(result[0]!.name).toBe('Valid')
  })

  it('skips entries with undefined labels', () => {
    const data = [
      makeStats([
        { duration: MS_PER_HOUR, label: undefined },
        { duration: MS_PER_HOUR, label: 'Valid' },
      ]),
    ]
    const result = aggregateProjectHours(data as any)
    expect(result).toHaveLength(1)
    expect(result[0]!.name).toBe('Valid')
  })

  it('skips entries with zero duration', () => {
    const data = [
      makeStats([
        { duration: 0, label: 'Zero' },
        { duration: MS_PER_HOUR, label: 'Valid' },
      ]),
    ]
    const result = aggregateProjectHours(data as any)
    expect(result).toHaveLength(1)
    expect(result[0]!.name).toBe('Valid')
  })

  it('treats null duration as 0 and skips', () => {
    const data = [
      makeStats([
        { duration: null, label: 'NullDur' },
        { duration: MS_PER_HOUR, label: 'Valid' },
      ]),
    ]
    const result = aggregateProjectHours(data as any)
    expect(result).toHaveLength(1)
    expect(result[0]!.name).toBe('Valid')
  })
})
