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

import { DEFAULT_TIME_ZONE } from '~/lib/utils/time-zone'

import { getUserClock, parseTimeZoneCookie } from './time-zone-cookie.server'

describe('parseTimeZoneCookie', () => {
  it('reads the zone that the inline script encodes', () => {
    expect(parseTimeZoneCookie(`theme=dark; tz=${encodeURIComponent('America/New_York')}`)).toBe(
      'America/New_York',
    )
  })

  it('falls back to the default zone without a valid cookie', () => {
    expect(parseTimeZoneCookie(null)).toBe(DEFAULT_TIME_ZONE)
    expect(parseTimeZoneCookie('theme=dark')).toBe(DEFAULT_TIME_ZONE)
    expect(parseTimeZoneCookie('tz=Mars%2FBase')).toBe(DEFAULT_TIME_ZONE)
    expect(parseTimeZoneCookie('tz=')).toBe(DEFAULT_TIME_ZONE)
  })
})

describe('getUserClock', () => {
  it('uses the zone of the request cookie', () => {
    const request = new Request('http://localhost/', {
      headers: { Cookie: 'tz=Pacific%2FKiritimati' },
    })
    const kiritimatiToday = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Pacific/Kiritimati',
    }).format(new Date())
    expect(getUserClock(request).today).toBe(kiritimatiToday)
  })
})
