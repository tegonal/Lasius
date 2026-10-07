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
  apiDatespanFromTo,
  apiTimespanDay,
  apiTimespanFromTo,
  apiTimespanMonth,
  apiTimespanWeek,
  formatISOLocale,
  getMonthOfDate,
  getWeekOfDate,
  getWorkingHoursWeekdayString,
  isoDateOrFallback,
  toCalendarDay,
  toLocalDate,
} from './dates'

describe('isoDateOrFallback', () => {
  const fallback = '2024-01-15'

  it('returns a valid ISO date unchanged', () => {
    expect(isoDateOrFallback('2024-03-01', fallback)).toBe('2024-03-01')
    expect(isoDateOrFallback('2024-03-01T08:00:00.000+01:00', fallback)).toBe(
      '2024-03-01T08:00:00.000+01:00',
    )
  })

  it('returns the fallback for a missing, empty or invalid value', () => {
    expect(isoDateOrFallback(null, fallback)).toBe(fallback)
    expect(isoDateOrFallback('', fallback)).toBe(fallback)
    expect(isoDateOrFallback('not-a-date', fallback)).toBe(fallback)
    expect(isoDateOrFallback('2024-13-45', fallback)).toBe(fallback)
  })

  it('accepts ISO forms that only parseISO reads and non-ISO forms that only new Date reads', () => {
    for (const value of ['2024-W10', '20240303', '2024/03/03']) {
      expect(isoDateOrFallback(value, fallback)).toBe(value)
      expect(() => apiTimespanDay(value)).not.toThrow()
    }
  })
})

// A UTC parse of "2026-10-05" gives 4 October west of UTC. Run with TZ=America/New_York to check.
describe('a date-only string is a local date', () => {
  const monday = '2026-10-05'

  it('getWorkingHoursWeekdayString', () => {
    expect(getWorkingHoursWeekdayString(monday)).toBe('monday')
  })

  it('apiTimespanDay', () => {
    expect(apiTimespanDay(monday)).toEqual({
      from: '2026-10-05T00:00:00.000',
      to: '2026-10-05T23:59:59.999',
    })
  })

  it('apiTimespanWeek', () => {
    expect(apiTimespanWeek(monday)).toEqual({
      from: '2026-10-05T00:00:00.000',
      to: '2026-10-11T23:59:59.999',
    })
  })

  it('apiTimespanMonth on the first day of the month', () => {
    expect(apiTimespanMonth('2026-10-01')).toEqual({
      from: '2026-10-01T00:00:00.000',
      to: '2026-10-31T23:59:59.999',
    })
  })

  it('apiTimespanFromTo and apiDatespanFromTo', () => {
    expect(apiTimespanFromTo(monday, monday)).toEqual({
      from: '2026-10-05T00:00:00.000',
      to: '2026-10-05T23:59:59.999',
    })
    expect(apiDatespanFromTo(monday, monday)).toEqual({ from: '2026-10-05', to: '2026-10-05' })
  })

  it('getWeekOfDate and getMonthOfDate', () => {
    const week = getWeekOfDate(monday)
    expect([week[0]?.slice(0, 10), week[6]?.slice(0, 10)]).toEqual(['2026-10-05', '2026-10-11'])
    const month = getMonthOfDate('2026-10-01')
    expect([month[0]?.slice(0, 10), month.length]).toEqual(['2026-10-01', 31])
  })
})

// A range bound carries the offset of the browser that wrote it. The server must keep the written day.
describe('a range bound with an offset keeps its written day', () => {
  it.each([
    ['Tokyo', '+09:00'],
    ['New York', '-04:00'],
    ['Zurich', '+02:00'],
  ])('apiTimespanFromTo and apiDatespanFromTo for %s', (_zone, offset) => {
    const from = `2026-10-07T00:00:00.000${offset}`
    const to = `2026-10-07T23:59:59.999${offset}`
    expect(apiTimespanFromTo(from, to)).toEqual({
      from: '2026-10-07T00:00:00.000',
      to: '2026-10-07T23:59:59.999',
    })
    expect(apiDatespanFromTo(from, to)).toEqual({ from: '2026-10-07', to: '2026-10-07' })
  })

  it('apiTimespanDay and getWeekOfDate', () => {
    expect(apiTimespanDay('2026-10-05T23:30:00.000+09:00').from).toBe('2026-10-05T00:00:00.000')
    expect(getWeekOfDate('2026-10-05T01:00:00.000-04:00')[0]?.slice(0, 10)).toBe('2026-10-05')
  })
})

describe('toCalendarDay and toLocalDate', () => {
  it('toCalendarDay returns local midnight of the written day', () => {
    const day = toCalendarDay('2026-10-05T23:30:00.000+09:00')
    expect([day.getFullYear(), day.getMonth(), day.getDate(), day.getHours()]).toEqual([
      2026, 9, 5, 0,
    ])
  })

  it('toLocalDate keeps the instant of a string with an offset', () => {
    const instant = '2026-10-05T23:30:00.000+09:00'
    expect(toLocalDate(instant).getTime()).toBe(new Date(instant).getTime())
  })

  it('both read non-ISO input like new Date', () => {
    expect(toCalendarDay('2024/03/03').getTime()).toBe(new Date('2024/03/03').getTime())
    expect(toLocalDate('2024/03/03').getTime()).toBe(new Date('2024/03/03').getTime())
  })
})

describe('formatISOLocale', () => {
  it('formats a valid date to ISO string with timezone offset', () => {
    const date = new Date(2024, 0, 15, 10, 30, 0, 0)
    const result = formatISOLocale(date)
    // Should match pattern: yyyy-MM-ddTHH:mm:ss.SSS+HH:MM
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/)
    expect(result).toContain('2024-01-15T10:30:00.000')
  })

  it('returns empty string for invalid date', () => {
    const result = formatISOLocale(new Date('invalid'))
    expect(result).toBe('')
  })
})

describe('getWeekOfDate', () => {
  it('returns 7 days for a week (Monday start)', () => {
    // 2024-01-15 is a Monday
    const result = getWeekOfDate(new Date(2024, 0, 15))
    expect(result).toHaveLength(7)
  })

  it('starts on Monday', () => {
    // 2024-01-17 is a Wednesday
    const result = getWeekOfDate(new Date(2024, 0, 17))
    expect(result[0]).toContain('2024-01-15') // Monday
    expect(result[6]).toContain('2024-01-21') // Sunday
  })

  it('accepts an ISO date string', () => {
    const result = getWeekOfDate('2024-01-17T10:00:00.000+01:00')
    expect(result).toHaveLength(7)
    expect(result[0]).toContain('2024-01-15')
  })
})

describe('getMonthOfDate', () => {
  it('returns correct number of days for January', () => {
    const result = getMonthOfDate(new Date(2024, 0, 15))
    expect(result).toHaveLength(31)
  })

  it('returns correct number of days for February (leap year)', () => {
    const result = getMonthOfDate(new Date(2024, 1, 10))
    expect(result).toHaveLength(29)
  })

  it('returns correct number of days for February (non-leap year)', () => {
    const result = getMonthOfDate(new Date(2023, 1, 10))
    expect(result).toHaveLength(28)
  })

  it('accepts an ISO date string', () => {
    const result = getMonthOfDate('2024-03-10T10:00:00.000+01:00')
    expect(result).toHaveLength(31)
  })
})

describe('apiTimespanWeek', () => {
  it('returns from/to spanning the full week', () => {
    // 2024-01-17 is a Wednesday
    const result = apiTimespanWeek('2024-01-17T10:00:00.000+01:00')
    expect(result.from).toContain('2024-01-15T00:00:00.000')
    expect(result.to).toContain('2024-01-21T23:59:59.999')
  })
})

describe('apiTimespanMonth', () => {
  it('returns from/to spanning the full month', () => {
    const result = apiTimespanMonth('2024-01-17T10:00:00.000+01:00')
    expect(result.from).toContain('2024-01-01T00:00:00.000')
    expect(result.to).toContain('2024-01-31T23:59:59.999')
  })
})

describe('apiTimespanDay', () => {
  it('returns from/to spanning the full day', () => {
    const result = apiTimespanDay('2026-03-15T10:00:00.000+01:00')
    expect(result.from).toContain('2026-03-15T00:00:00.000')
    expect(result.to).toContain('2026-03-15T23:59:59.999')
  })
})

describe('apiTimespanFromTo', () => {
  it('returns from/to spanning start of from-day to end of to-day', () => {
    const result = apiTimespanFromTo(
      '2026-03-01T10:00:00.000+01:00',
      '2026-03-15T10:00:00.000+01:00',
    )
    expect(result).not.toBeNull()
    expect(result!.from).toContain('2026-03-01T00:00:00.000')
    expect(result!.to).toContain('2026-03-15T23:59:59.999')
  })

  it('returns null for empty strings', () => {
    expect(apiTimespanFromTo('', '')).toBeNull()
  })

  it('returns null for an invalid date', () => {
    expect(apiTimespanFromTo('2026-03-01T10:00:00.000+01:00', 'not-a-date')).toBeNull()
  })
})

describe('apiDatespanFromTo', () => {
  it('returns the dates of the from-day and the to-day', () => {
    expect(
      apiDatespanFromTo('2026-03-01T10:00:00.000+01:00', '2026-03-15T10:00:00.000+01:00'),
    ).toEqual({ from: '2026-03-01', to: '2026-03-15' })
  })

  it('returns null for empty strings', () => {
    expect(apiDatespanFromTo('', '2026-03-15T10:00:00.000+01:00')).toBeNull()
  })

  it('returns null for an invalid date', () => {
    expect(apiDatespanFromTo('not-a-date', '2026-03-15T10:00:00.000+01:00')).toBeNull()
  })
})
