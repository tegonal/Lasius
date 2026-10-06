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

import { _getBackoffDelay } from './websocket-manager'

describe('getBackoffDelay', () => {
  it('returns 1000ms for attempt 0', () => {
    expect(_getBackoffDelay(0)).toBe(1000)
  })

  it('returns 2000ms for attempt 1', () => {
    expect(_getBackoffDelay(1)).toBe(2000)
  })

  it('returns 4000ms for attempt 2', () => {
    expect(_getBackoffDelay(2)).toBe(4000)
  })

  it('returns 8000ms for attempt 3', () => {
    expect(_getBackoffDelay(3)).toBe(8000)
  })

  it('caps at 10000ms for attempt 4+', () => {
    expect(_getBackoffDelay(4)).toBe(10_000)
    expect(_getBackoffDelay(5)).toBe(10_000)
    expect(_getBackoffDelay(10)).toBe(10_000)
    expect(_getBackoffDelay(29)).toBe(10_000)
  })
})
