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
  addMinutesToDate,
  calculateDurationMinutes,
  formatDuration,
  parseDuration,
} from './duration-utils'

describe('addMinutesToDate', () => {
  it('should add 30 minutes to a date', () => {
    const date = new Date(2026, 2, 24, 14, 0, 0)
    const result = addMinutesToDate(date, 30)
    expect(result.getHours()).toBe(14)
    expect(result.getMinutes()).toBe(30)
  })

  it('should add 0 minutes (no change)', () => {
    const date = new Date(2026, 2, 24, 14, 0, 0)
    const result = addMinutesToDate(date, 0)
    expect(result.getTime()).toBe(date.getTime())
  })

  it('should add negative minutes (subtract)', () => {
    const date = new Date(2026, 2, 24, 14, 30, 0)
    const result = addMinutesToDate(date, -15)
    expect(result.getHours()).toBe(14)
    expect(result.getMinutes()).toBe(15)
  })

  it('should cross hour boundary (45 min to 14:30 → 15:15)', () => {
    const date = new Date(2026, 2, 24, 14, 30, 0)
    const result = addMinutesToDate(date, 45)
    expect(result.getHours()).toBe(15)
    expect(result.getMinutes()).toBe(15)
  })

  it('should not mutate original date', () => {
    const date = new Date(2026, 2, 24, 14, 0, 0)
    const originalTime = date.getTime()
    addMinutesToDate(date, 30)
    expect(date.getTime()).toBe(originalTime)
  })
})

describe('calculateDurationMinutes', () => {
  it('should return 90 for two dates 90 minutes apart', () => {
    const start = new Date(2026, 2, 24, 14, 0, 0)
    const end = new Date(2026, 2, 24, 15, 30, 0)
    expect(calculateDurationMinutes(start, end)).toBe(90)
  })

  it('should return 0 for same date', () => {
    const date = new Date(2026, 2, 24, 14, 0, 0)
    expect(calculateDurationMinutes(date, date)).toBe(0)
  })

  it('should return 0 for null start', () => {
    const end = new Date(2026, 2, 24, 15, 0, 0)
    expect(calculateDurationMinutes(null, end)).toBe(0)
  })

  it('should return 0 for null end', () => {
    const start = new Date(2026, 2, 24, 14, 0, 0)
    expect(calculateDurationMinutes(start, null)).toBe(0)
  })

  it('should return 0 for both null', () => {
    expect(calculateDurationMinutes(null, null)).toBe(0)
  })

  it('should return negative number when end is before start', () => {
    const start = new Date(2026, 2, 24, 15, 30, 0)
    const end = new Date(2026, 2, 24, 14, 0, 0)
    expect(calculateDurationMinutes(start, end)).toBeLessThan(0)
  })
})

describe('formatDuration', () => {
  it('should format 0 as "00:00"', () => {
    expect(formatDuration(0)).toBe('00:00')
  })

  it('should format 90 as "01:30"', () => {
    expect(formatDuration(90)).toBe('01:30')
  })

  it('should format 5 as "00:05"', () => {
    expect(formatDuration(5)).toBe('00:05')
  })

  it('should format 60 as "01:00"', () => {
    expect(formatDuration(60)).toBe('01:00')
  })

  it('should format 125 as "02:05"', () => {
    expect(formatDuration(125)).toBe('02:05')
  })

  it('should format -90 as "-01:30"', () => {
    expect(formatDuration(-90)).toBe('-01:30')
  })
})

describe('parseDuration', () => {
  it('should parse "01:30" as 90', () => {
    expect(parseDuration('01:30')).toBe(90)
  })

  it('should parse "00:00" as 0', () => {
    expect(parseDuration('00:00')).toBe(0)
  })

  it('should parse "00:05" as 5', () => {
    expect(parseDuration('00:05')).toBe(5)
  })

  it('should parse "2:05" as 125 (single-digit hour)', () => {
    expect(parseDuration('2:05')).toBe(125)
  })

  it('should parse "-01:30" as -90', () => {
    expect(parseDuration('-01:30')).toBe(-90)
  })

  it('should return null for "invalid"', () => {
    expect(parseDuration('invalid')).toBeNull()
  })

  it('should return null for "01:60" (minutes >= 60)', () => {
    expect(parseDuration('01:60')).toBeNull()
  })

  it('should return null for empty string', () => {
    expect(parseDuration('')).toBeNull()
  })

  it('should return null for "abc"', () => {
    expect(parseDuration('abc')).toBeNull()
  })

  it('should return null for "1:2" (minutes need 2 digits)', () => {
    expect(parseDuration('1:2')).toBeNull()
  })
})
