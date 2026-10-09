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

import { getTrustedClientIp } from './client-ip.server'

const requestWith = (headers: Record<string, string>) =>
  new Request('http://localhost/api/event', { headers })

describe('getTrustedClientIp', () => {
  it('returns the single X-Forwarded-For entry', () => {
    expect(getTrustedClientIp(requestWith({ 'x-forwarded-for': '203.0.113.7' }))).toBe(
      '203.0.113.7',
    )
  })

  it('returns the last entry, because a client can forge the entries before it', () => {
    const request = requestWith({ 'x-forwarded-for': '198.51.100.1, 203.0.113.7' })
    expect(getTrustedClientIp(request)).toBe('203.0.113.7')
  })

  it('ignores X-Client-IP and X-Real-IP', () => {
    const request = requestWith({
      'x-client-ip': '198.51.100.1',
      'x-forwarded-for': '203.0.113.7',
      'x-real-ip': '198.51.100.2',
    })
    expect(getTrustedClientIp(request)).toBe('203.0.113.7')
  })

  it('returns an empty string without X-Forwarded-For', () => {
    expect(getTrustedClientIp(requestWith({ 'x-client-ip': '198.51.100.1' }))).toBe('')
  })
})
