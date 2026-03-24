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
  handleArrowIncrement,
  handleMultiDigitInput,
  handleSegmentReplacement,
} from './segment-utils'

type DateSegment = 'day' | 'month' | 'year'
type TimeSegment = 'hour' | 'minute'

const dateSegmentIndex = (segment: DateSegment): number => {
  switch (segment) {
    case 'day':
      return 0
    case 'month':
      return 1
    case 'year':
      return 2
  }
}

const timeSegmentIndex = (segment: TimeSegment): number => {
  switch (segment) {
    case 'hour':
      return 0
    case 'minute':
      return 1
  }
}

describe('handleArrowIncrement', () => {
  it('increments day by 1', () => {
    const date = new Date(2026, 2, 15, 10, 30) // March 15, 2026
    const result = handleArrowIncrement(date, 'day', 1)
    expect(result.getDate()).toBe(16)
    expect(result.getMonth()).toBe(2)
    expect(result.getFullYear()).toBe(2026)
  })

  it('decrements day by 1', () => {
    const date = new Date(2026, 2, 15, 10, 30)
    const result = handleArrowIncrement(date, 'day', -1)
    expect(result.getDate()).toBe(14)
    expect(result.getMonth()).toBe(2)
    expect(result.getFullYear()).toBe(2026)
  })

  it('increments month by 1', () => {
    const date = new Date(2026, 2, 15, 10, 30) // March
    const result = handleArrowIncrement(date, 'month', 1)
    expect(result.getMonth()).toBe(3) // April
    expect(result.getFullYear()).toBe(2026)
  })

  it('decrements month by 1', () => {
    const date = new Date(2026, 2, 15, 10, 30) // March
    const result = handleArrowIncrement(date, 'month', -1)
    expect(result.getMonth()).toBe(1) // February
    expect(result.getFullYear()).toBe(2026)
  })

  it('increments year by 1', () => {
    const date = new Date(2026, 2, 15, 10, 30)
    const result = handleArrowIncrement(date, 'year', 1)
    expect(result.getFullYear()).toBe(2027)
    expect(result.getMonth()).toBe(2)
    expect(result.getDate()).toBe(15)
  })

  it('increments hour by 1', () => {
    const date = new Date(2026, 2, 15, 14, 30)
    const result = handleArrowIncrement(date, 'hour', 1)
    expect(result.getHours()).toBe(15)
    expect(result.getMinutes()).toBe(30)
  })

  it('wraps hour from 23 to 0', () => {
    const date = new Date(2026, 2, 15, 23, 30)
    const result = handleArrowIncrement(date, 'hour', 1)
    expect(result.getHours()).toBe(0)
  })

  it('increments minute by 1', () => {
    const date = new Date(2026, 2, 15, 14, 30)
    const result = handleArrowIncrement(date, 'minute', 1)
    expect(result.getMinutes()).toBe(31)
    expect(result.getHours()).toBe(14)
  })

  it('wraps minute from 59 to 0', () => {
    const date = new Date(2026, 2, 15, 14, 59)
    const result = handleArrowIncrement(date, 'minute', 1)
    expect(result.getMinutes()).toBe(0)
  })

  it('does not mutate original date', () => {
    const date = new Date(2026, 2, 15, 10, 30)
    const originalTime = date.getTime()
    handleArrowIncrement(date, 'day', 1)
    expect(date.getTime()).toBe(originalTime)
  })

  it('returns same date values for unknown segment', () => {
    const date = new Date(2026, 2, 15, 10, 30)
    const result = handleArrowIncrement(date, 'unknown', 1)
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(2)
    expect(result.getDate()).toBe(15)
    expect(result.getHours()).toBe(10)
    expect(result.getMinutes()).toBe(30)
  })
})

describe('handleMultiDigitInput', () => {
  it('appends digit to day segment', () => {
    const shouldAutoAdvance = (_segment: DateSegment, _parts: string[]) => true
    const result = handleMultiDigitInput<DateSegment>(
      '2.03.2026',
      '2.03.20265',
      'day',
      '.',
      dateSegmentIndex,
      shouldAutoAdvance,
    )
    expect(result).not.toBeNull()
    expect(result!.newValue).toBe('25.03.2026')
    expect(result!.shouldAdvance).toBe(true)
  })

  it('returns null when no segment is selected', () => {
    const result = handleMultiDigitInput<DateSegment>(
      '15.03.2026',
      '15.03.20267',
      null,
      '.',
      dateSegmentIndex,
      () => false,
    )
    expect(result).toBeNull()
  })

  it('returns null for non-digit input', () => {
    const result = handleMultiDigitInput<DateSegment>(
      '15.03.2026',
      '15.03.2026a',
      'day',
      '.',
      dateSegmentIndex,
      () => false,
    )
    expect(result).toBeNull()
  })

  it('returns null when new value is shorter (deletion)', () => {
    const result = handleMultiDigitInput<DateSegment>(
      '15.03.2026',
      '15.03.202',
      'day',
      '.',
      dateSegmentIndex,
      () => false,
    )
    expect(result).toBeNull()
  })
})

describe('handleSegmentReplacement', () => {
  const formatSegmentValue = (value: string, _segment: DateSegment): string =>
    value

  it('replaces segment when selection matches bounds and digit is typed', () => {
    const result = handleSegmentReplacement<DateSegment>(
      '15.03.2026',
      '5.03.2026',
      'day',
      0,
      2,
      { end: 2, start: 0 },
      '.',
      dateSegmentIndex,
      formatSegmentValue,
    )
    expect(result).not.toBeNull()
    expect(result!.newValue).toBe('5.03.2026')
    expect(result!.shouldAdvance).toBe(true)
  })

  it('returns null when selection does not match segment bounds', () => {
    const result = handleSegmentReplacement<DateSegment>(
      '15.03.2026',
      '1.03.2026',
      'day',
      0,
      1,
      { end: 2, start: 0 },
      '.',
      dateSegmentIndex,
      formatSegmentValue,
    )
    expect(result).toBeNull()
  })

  it('returns null for non-digit input', () => {
    const result = handleSegmentReplacement<DateSegment>(
      '15.03.2026',
      'a5.03.2026',
      'day',
      0,
      2,
      { end: 2, start: 0 },
      '.',
      dateSegmentIndex,
      formatSegmentValue,
    )
    expect(result).toBeNull()
  })

  it('returns null when no segment is selected', () => {
    const result = handleSegmentReplacement<DateSegment>(
      '15.03.2026',
      '5.03.2026',
      null,
      0,
      2,
      { end: 2, start: 0 },
      '.',
      dateSegmentIndex,
      formatSegmentValue,
    )
    expect(result).toBeNull()
  })
})
