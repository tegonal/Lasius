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

import { getSegmentBounds, getSegmentFromPosition } from './segment-bounds'

type DateSegment = 'day' | 'month' | 'year'
const DATE_SEGMENTS: DateSegment[] = ['day', 'month', 'year']

type TimeSegment = 'hour' | 'minute'
const TIME_SEGMENTS: TimeSegment[] = ['hour', 'minute']

describe('getSegmentBounds', () => {
  it('returns correct bounds for date "24.03.2026"', () => {
    const result = getSegmentBounds('24.03.2026', '.', DATE_SEGMENTS)
    expect(result).toEqual({
      day: { end: 2, start: 0 },
      month: { end: 5, start: 3 },
      year: { end: 10, start: 6 },
    })
  })

  it('returns correct bounds for time "14:30"', () => {
    const result = getSegmentBounds('14:30', ':', TIME_SEGMENTS)
    expect(result).toEqual({
      hour: { end: 2, start: 0 },
      minute: { end: 5, start: 3 },
    })
  })

  it('returns null when parts count does not match segments', () => {
    expect(getSegmentBounds('24.03', '.', DATE_SEGMENTS)).toBeNull()
  })

  it('returns null for empty string with no segments (split produces [""])', () => {
    expect(getSegmentBounds('', '.', [])).toBeNull()
  })

  it('returns correct bounds for single-digit parts like "1.2.2026"', () => {
    const result = getSegmentBounds('1.2.2026', '.', DATE_SEGMENTS)
    expect(result).toEqual({
      day: { end: 1, start: 0 },
      month: { end: 3, start: 2 },
      year: { end: 8, start: 4 },
    })
  })
})

describe('getSegmentFromPosition', () => {
  it('position 0 in "24.03.2026" returns day', () => {
    expect(getSegmentFromPosition(0, '24.03.2026', '.', DATE_SEGMENTS)).toBe(
      'day',
    )
  })

  it('position 1 in "24.03.2026" returns day', () => {
    expect(getSegmentFromPosition(1, '24.03.2026', '.', DATE_SEGMENTS)).toBe(
      'day',
    )
  })

  it('position 2 (end of day segment) in "24.03.2026" returns day', () => {
    expect(getSegmentFromPosition(2, '24.03.2026', '.', DATE_SEGMENTS)).toBe(
      'day',
    )
  })

  it('position 3 in "24.03.2026" returns month', () => {
    expect(getSegmentFromPosition(3, '24.03.2026', '.', DATE_SEGMENTS)).toBe(
      'month',
    )
  })

  it('position 5 in "24.03.2026" returns month', () => {
    expect(getSegmentFromPosition(5, '24.03.2026', '.', DATE_SEGMENTS)).toBe(
      'month',
    )
  })

  it('position 6 in "24.03.2026" returns year', () => {
    expect(getSegmentFromPosition(6, '24.03.2026', '.', DATE_SEGMENTS)).toBe(
      'year',
    )
  })

  it('position 10 in "24.03.2026" returns year', () => {
    expect(getSegmentFromPosition(10, '24.03.2026', '.', DATE_SEGMENTS)).toBe(
      'year',
    )
  })

  it('position beyond end returns last segment', () => {
    expect(getSegmentFromPosition(15, '24.03.2026', '.', DATE_SEGMENTS)).toBe(
      'year',
    )
  })

  it('returns null for invalid input (mismatched segments)', () => {
    expect(getSegmentFromPosition(0, '24.03', '.', DATE_SEGMENTS)).toBeNull()
  })

  it('works with time segments', () => {
    expect(getSegmentFromPosition(0, '14:30', ':', TIME_SEGMENTS)).toBe('hour')
    expect(getSegmentFromPosition(3, '14:30', ':', TIME_SEGMENTS)).toBe(
      'minute',
    )
  })
})
