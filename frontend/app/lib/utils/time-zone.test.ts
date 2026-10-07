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

import { startOfDay } from 'date-fns'
import { describe, expect, it } from 'vitest'

import { dateOptions } from '~/lib/utils/date/date-options'
import { formatISOLocale } from '~/lib/utils/dates'

import { createUserClock, isValidTimeZone } from './time-zone'

// 02:00 UTC on Monday 5 October: Sunday 22:00 in New York, Monday 04:00 in Zurich.
const instant = new Date('2026-10-05T02:00:00.000Z')

const rangeOf = (name: string, timeZone: string) => {
  const option = dateOptions.find((o) => o.name === name)
  const clock = createUserClock(timeZone, instant)
  return option?.dateRangeFn(clock.now, clock.formatISO)
}

describe('isValidTimeZone', () => {
  it('accepts an IANA zone and rejects anything else', () => {
    expect(isValidTimeZone('Europe/Zurich')).toBe(true)
    expect(isValidTimeZone('America/New_York')).toBe(true)
    expect(isValidTimeZone('UTC')).toBe(true)
    expect(isValidTimeZone('Mars/Base')).toBe(false)
    expect(isValidTimeZone('')).toBe(false)
    expect(isValidTimeZone(undefined)).toBe(false)
    expect(isValidTimeZone(5)).toBe(false)
  })
})

describe('createUserClock', () => {
  it('returns today of the user zone, not of the server', () => {
    expect(createUserClock('America/New_York', instant).today).toBe('2026-10-04')
    expect(createUserClock('Europe/Zurich', instant).today).toBe('2026-10-05')
    expect(createUserClock('Asia/Tokyo', instant).today).toBe('2026-10-05')
  })

  it('formats a wall time with the offset of the user zone', () => {
    const clock = createUserClock('America/New_York', instant)
    expect(clock.formatISO(startOfDay(clock.now))).toBe('2026-10-04T00:00:00.000-04:00')
  })

  it('formats like formatISOLocale when the user zone is the process zone', () => {
    const processZone = new Intl.DateTimeFormat().resolvedOptions().timeZone
    const clock = createUserClock(processZone, instant)
    expect(clock.formatISO(startOfDay(clock.now))).toBe(formatISOLocale(startOfDay(instant)))
  })
})

describe('dateRangeFn with a user clock', () => {
  it('gives the week of the user zone', () => {
    expect(rangeOf('This week', 'America/New_York')).toEqual({
      from: '2026-09-28T00:00:00.000-04:00',
      to: '2026-10-04T23:59:59.999-04:00',
    })
    expect(rangeOf('This week', 'Europe/Zurich')).toEqual({
      from: '2026-10-05T00:00:00.000+02:00',
      to: '2026-10-11T23:59:59.999+02:00',
    })
  })

  it('gives yesterday of the user zone', () => {
    expect(rangeOf('Yesterday', 'America/New_York')).toEqual({
      from: '2026-10-03T00:00:00.000-04:00',
      to: '2026-10-03T23:59:59.999-04:00',
    })
    expect(rangeOf('Yesterday', 'Asia/Tokyo')).toEqual({
      from: '2026-10-04T00:00:00.000+09:00',
      to: '2026-10-04T23:59:59.999+09:00',
    })
  })
})
