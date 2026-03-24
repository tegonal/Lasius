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

import { type SegmentBounds } from './segment-bounds'
import {
  getAdjacentSegment,
  getArrowKeyTarget,
  getTabTarget,
} from './segment-navigation'

type DateSegment = 'day' | 'month' | 'year'
const DATE_SEGMENTS: DateSegment[] = ['day', 'month', 'year']

type TimeSegment = 'hour' | 'minute'
const TIME_SEGMENTS: TimeSegment[] = ['hour', 'minute']

// Bounds for "24.03.2026" (DD.MM.YYYY)
const DATE_BOUNDS: SegmentBounds<DateSegment> = {
  day: { end: 2, start: 0 },
  month: { end: 5, start: 3 },
  year: { end: 10, start: 6 },
}

// Bounds for "14:30" (HH:MM)
const TIME_BOUNDS: SegmentBounds<TimeSegment> = {
  hour: { end: 2, start: 0 },
  minute: { end: 5, start: 3 },
}

describe('getAdjacentSegment', () => {
  it('returns next segment', () => {
    expect(getAdjacentSegment('day', 'next', DATE_SEGMENTS)).toBe('month')
    expect(getAdjacentSegment('month', 'next', DATE_SEGMENTS)).toBe('year')
  })

  it('returns prev segment', () => {
    expect(getAdjacentSegment('year', 'prev', DATE_SEGMENTS)).toBe('month')
    expect(getAdjacentSegment('month', 'prev', DATE_SEGMENTS)).toBe('day')
  })

  it('returns null at boundaries', () => {
    expect(getAdjacentSegment('day', 'prev', DATE_SEGMENTS)).toBeNull()
    expect(getAdjacentSegment('year', 'next', DATE_SEGMENTS)).toBeNull()
  })

  it('returns null for unknown segment', () => {
    expect(
      getAdjacentSegment('unknown' as DateSegment, 'next', DATE_SEGMENTS),
    ).toBeNull()
  })

  it('works with time segments', () => {
    expect(getAdjacentSegment('hour', 'next', TIME_SEGMENTS)).toBe('minute')
    expect(getAdjacentSegment('minute', 'prev', TIME_SEGMENTS)).toBe('hour')
    expect(getAdjacentSegment('hour', 'prev', TIME_SEGMENTS)).toBeNull()
    expect(getAdjacentSegment('minute', 'next', TIME_SEGMENTS)).toBeNull()
  })
})

describe('getArrowKeyTarget', () => {
  it('ArrowLeft at segment start navigates to prev segment', () => {
    expect(
      getArrowKeyTarget('ArrowLeft', 3, 'month', DATE_BOUNDS, DATE_SEGMENTS),
    ).toBe('day')
    expect(
      getArrowKeyTarget('ArrowLeft', 6, 'year', DATE_BOUNDS, DATE_SEGMENTS),
    ).toBe('month')
  })

  it('ArrowRight at segment end navigates to next segment', () => {
    expect(
      getArrowKeyTarget('ArrowRight', 2, 'day', DATE_BOUNDS, DATE_SEGMENTS),
    ).toBe('month')
    expect(
      getArrowKeyTarget('ArrowRight', 5, 'month', DATE_BOUNDS, DATE_SEGMENTS),
    ).toBe('year')
  })

  it('returns null when not at boundary', () => {
    expect(
      getArrowKeyTarget('ArrowLeft', 4, 'month', DATE_BOUNDS, DATE_SEGMENTS),
    ).toBeNull()
    expect(
      getArrowKeyTarget('ArrowRight', 1, 'day', DATE_BOUNDS, DATE_SEGMENTS),
    ).toBeNull()
  })

  it('returns null at edges (no adjacent segment)', () => {
    expect(
      getArrowKeyTarget('ArrowLeft', 0, 'day', DATE_BOUNDS, DATE_SEGMENTS),
    ).toBeNull()
    expect(
      getArrowKeyTarget('ArrowRight', 10, 'year', DATE_BOUNDS, DATE_SEGMENTS),
    ).toBeNull()
  })

  it('works with time segments', () => {
    expect(
      getArrowKeyTarget('ArrowRight', 2, 'hour', TIME_BOUNDS, TIME_SEGMENTS),
    ).toBe('minute')
    expect(
      getArrowKeyTarget('ArrowLeft', 3, 'minute', TIME_BOUNDS, TIME_SEGMENTS),
    ).toBe('hour')
  })
})

describe('getTabTarget', () => {
  it('Tab moves to next segment', () => {
    expect(getTabTarget(false, 'day', DATE_SEGMENTS)).toBe('month')
    expect(getTabTarget(false, 'month', DATE_SEGMENTS)).toBe('year')
  })

  it('Shift+Tab moves to prev segment', () => {
    expect(getTabTarget(true, 'year', DATE_SEGMENTS)).toBe('month')
    expect(getTabTarget(true, 'month', DATE_SEGMENTS)).toBe('day')
  })

  it('returns null at edges (browser default should apply)', () => {
    expect(getTabTarget(false, 'year', DATE_SEGMENTS)).toBeNull()
    expect(getTabTarget(true, 'day', DATE_SEGMENTS)).toBeNull()
  })

  it('works with time segments', () => {
    expect(getTabTarget(false, 'hour', TIME_SEGMENTS)).toBe('minute')
    expect(getTabTarget(true, 'minute', TIME_SEGMENTS)).toBe('hour')
    expect(getTabTarget(false, 'minute', TIME_SEGMENTS)).toBeNull()
    expect(getTabTarget(true, 'hour', TIME_SEGMENTS)).toBeNull()
  })
})
