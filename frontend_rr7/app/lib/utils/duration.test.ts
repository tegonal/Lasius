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
  decimalHoursToDurationString,
  durationAsString,
  durationInHoursAsNumber,
} from './duration'

describe('durationInHoursAsNumber', () => {
  it('returns 1 for a 1-hour difference', () => {
    expect(
      durationInHoursAsNumber('2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
    ).toBe(1)
  })

  it('returns 0.5 for a 30-minute difference', () => {
    expect(
      durationInHoursAsNumber('2024-01-01T10:00:00Z', '2024-01-01T10:30:00Z'),
    ).toBe(0.5)
  })

  it('returns 0 when start and end are the same', () => {
    expect(
      durationInHoursAsNumber('2024-01-01T10:00:00Z', '2024-01-01T10:00:00Z'),
    ).toBe(0)
  })

  it('returns a negative value when end is before start', () => {
    expect(
      durationInHoursAsNumber('2024-01-01T11:00:00Z', '2024-01-01T10:00:00Z'),
    ).toBe(-1)
  })
})

describe('durationAsString', () => {
  it('formats 1 hour as "01:00"', () => {
    expect(
      durationAsString('2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z'),
    ).toBe('01:00')
  })

  it('formats 1 hour 30 minutes as "01:30"', () => {
    expect(
      durationAsString('2024-01-01T10:00:00Z', '2024-01-01T11:30:00Z'),
    ).toBe('01:30')
  })

  it('formats zero duration as "00:00"', () => {
    expect(
      durationAsString('2024-01-01T10:00:00Z', '2024-01-01T10:00:00Z'),
    ).toBe('00:00')
  })

  it('formats multi-hour durations correctly', () => {
    expect(
      durationAsString('2024-01-01T08:00:00Z', '2024-01-01T17:45:00Z'),
    ).toBe('09:45')
  })
})

describe('decimalHoursToDurationString', () => {
  it('converts 1.5 hours to "01:30"', () => {
    expect(decimalHoursToDurationString(1.5)).toBe('01:30')
  })

  it('converts 0.25 hours to "00:15"', () => {
    expect(decimalHoursToDurationString(0.25)).toBe('00:15')
  })

  it('converts 0 hours to "00:00"', () => {
    expect(decimalHoursToDurationString(0)).toBe('00:00')
  })

  it('converts 8.75 hours to "08:45"', () => {
    expect(decimalHoursToDurationString(8.75)).toBe('08:45')
  })

  it('converts whole hours correctly', () => {
    expect(decimalHoursToDurationString(3)).toBe('03:00')
  })
})
