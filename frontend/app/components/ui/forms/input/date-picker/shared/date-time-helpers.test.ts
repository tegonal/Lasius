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
  formatDate,
  formatDateString,
  formatTime,
  formatTimeString,
  getParentValue,
  parseDateTimeStrings,
} from './date-time-helpers'

describe('getParentValue', () => {
  const entry = { dateString: '08.10.2026', isPartial: false, isValid: true, timeString: '10:00' }

  it('sends the ISO string of a complete valid entry', () => {
    expect(getParentValue(entry, '2026-10-08T10:00:00.000+02:00')).toBe(
      '2026-10-08T10:00:00.000+02:00',
    )
  })

  it('sends nothing for a valid entry without an ISO string', () => {
    expect(getParentValue(entry, '')).toBeNull()
    expect(getParentValue(entry, null)).toBeNull()
  })

  it('sends nothing for a partial or an invalid entry with text', () => {
    expect(getParentValue({ ...entry, isPartial: true }, 'x')).toBeNull()
    expect(getParentValue({ ...entry, isValid: false }, 'x')).toBeNull()
    expect(getParentValue({ ...entry, dateString: '', isValid: false }, 'x')).toBeNull()
  })

  it('sends an empty text when the date and the time are empty', () => {
    expect(getParentValue({ ...entry, dateString: '', isValid: false, timeString: '' }, '')).toBe(
      '',
    )
  })
})

describe('formatDate', () => {
  it('formats a date as DD.MM.YYYY', () => {
    expect(formatDate(new Date(2026, 2, 24))).toBe('24.03.2026')
  })

  it('pads single-digit day and month with leading zeros', () => {
    expect(formatDate(new Date(2026, 0, 1))).toBe('01.01.2026')
  })

  it('formats end-of-year date correctly', () => {
    expect(formatDate(new Date(2026, 11, 31))).toBe('31.12.2026')
  })
})

describe('formatDateString', () => {
  it('returns the same result as formatDate (alias)', () => {
    expect(formatDateString(new Date(2026, 2, 24))).toBe('24.03.2026')
  })

  it('pads single-digit day and month with leading zeros', () => {
    expect(formatDateString(new Date(2026, 0, 1))).toBe('01.01.2026')
  })

  it('formats end-of-year date correctly', () => {
    expect(formatDateString(new Date(2026, 11, 31))).toBe('31.12.2026')
  })
})

describe('formatTime', () => {
  it('pads single-digit hours and minutes', () => {
    expect(formatTime(9, 5)).toBe('09:05')
  })

  it('formats double-digit hours and minutes', () => {
    expect(formatTime(14, 30)).toBe('14:30')
  })

  it('formats midnight as 00:00', () => {
    expect(formatTime(0, 0)).toBe('00:00')
  })

  it('formats end-of-day time', () => {
    expect(formatTime(23, 59)).toBe('23:59')
  })
})

describe('formatTimeString', () => {
  it('pads single-digit hours and minutes from a Date', () => {
    expect(formatTimeString(new Date(2026, 0, 1, 9, 5))).toBe('09:05')
  })

  it('formats double-digit hours and minutes from a Date', () => {
    expect(formatTimeString(new Date(2026, 0, 1, 14, 30))).toBe('14:30')
  })

  it('formats midnight from a Date', () => {
    expect(formatTimeString(new Date(2026, 0, 1, 0, 0))).toBe('00:00')
  })
})

describe('parseDateTimeStrings', () => {
  it('returns null date for empty strings', () => {
    const result = parseDateTimeStrings('', '')
    expect(result).toEqual({ date: null, isPartial: false, isValid: true })
  })

  it('returns null date for placeholder strings', () => {
    const result = parseDateTimeStrings('__.__.____', '__:__')
    expect(result).toEqual({ date: null, isPartial: false, isValid: true })
  })

  it('parses a valid date string without time', () => {
    const result = parseDateTimeStrings('24.03.2026', '')
    expect(result.isPartial).toBe(false)
    expect(result.isValid).toBe(true)
    expect(result.date).not.toBeNull()
    expect(result.date!.getFullYear()).toBe(2026)
    expect(result.date!.getMonth()).toBe(2)
    expect(result.date!.getDate()).toBe(24)
  })

  it('parses a valid date and time string combined', () => {
    const result = parseDateTimeStrings('24.03.2026', '14:30')
    expect(result.isPartial).toBe(false)
    expect(result.isValid).toBe(true)
    expect(result.date).not.toBeNull()
    expect(result.date!.getFullYear()).toBe(2026)
    expect(result.date!.getMonth()).toBe(2)
    expect(result.date!.getDate()).toBe(24)
    expect(result.date!.getHours()).toBe(14)
    expect(result.date!.getMinutes()).toBe(30)
  })

  it('parses single-digit day and month', () => {
    const result = parseDateTimeStrings('1.2.2026', '')
    expect(result.isValid).toBe(true)
    expect(result.date).not.toBeNull()
    expect(result.date!.getFullYear()).toBe(2026)
    expect(result.date!.getMonth()).toBe(1)
    expect(result.date!.getDate()).toBe(1)
  })

  it('parses short year format (2-digit)', () => {
    const result = parseDateTimeStrings('24.03.26', '')
    expect(result.isValid).toBe(true)
    expect(result.date).not.toBeNull()
    expect(result.date!.getFullYear()).toBe(2026)
    expect(result.date!.getMonth()).toBe(2)
    expect(result.date!.getDate()).toBe(24)
  })

  it('returns isPartial when date contains underscores', () => {
    const result = parseDateTimeStrings('24.0_.2026', '')
    expect(result).toEqual({ date: null, isPartial: true, isValid: true })
  })

  it('returns isValid false for invalid date string', () => {
    const result = parseDateTimeStrings('invalid', '')
    expect(result).toEqual({ date: null, isPartial: false, isValid: false })
  })

  it('parses time only using today as base date', () => {
    const result = parseDateTimeStrings('', '14:30')
    expect(result.isPartial).toBe(false)
    expect(result.isValid).toBe(true)
    expect(result.date).not.toBeNull()
    expect(result.date!.getHours()).toBe(14)
    expect(result.date!.getMinutes()).toBe(30)
  })

  it('returns isValid false for valid date with invalid time', () => {
    const result = parseDateTimeStrings('24.03.2026', 'invalid')
    expect(result).toEqual({ date: null, isPartial: false, isValid: false })
  })

  it('normalizes short year (1-digit) to current century', () => {
    const result = parseDateTimeStrings('24.03.6', '')
    expect(result.isValid).toBe(true)
    expect(result.date).not.toBeNull()
    expect(result.date!.getFullYear()).toBe(2006)
    expect(result.date!.getMonth()).toBe(2)
    expect(result.date!.getDate()).toBe(24)
  })

  it('returns isPartial when the date is the placeholder and the time is complete', () => {
    expect(parseDateTimeStrings('__.__.____', '14:30')).toEqual({
      date: null,
      isPartial: true,
      isValid: true,
    })
  })

  it('combines a date with a single-digit hour and clears seconds', () => {
    const result = parseDateTimeStrings('24.03.2026', '9:05')
    expect(result.isValid).toBe(true)
    expect(result.date).toEqual(new Date(2026, 2, 24, 9, 5, 0, 0))
  })

  it('returns isValid false for an invalid time without a date', () => {
    expect(parseDateTimeStrings('', '25:99')).toEqual({
      date: null,
      isPartial: false,
      isValid: false,
    })
  })

  it('returns isValid false for an invalid date before it reads the time', () => {
    expect(parseDateTimeStrings('31.02.2026', '10:00')).toEqual({
      date: null,
      isPartial: false,
      isValid: false,
    })
  })
})
