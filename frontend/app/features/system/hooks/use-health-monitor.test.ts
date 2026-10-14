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
  HEALTH_POLL_INTERVAL_MS,
  HEALTH_RETRY_BASE_MS,
  HEALTH_RETRY_MAX_MS,
} from '~/config/constants'

import { checkVersion, getRetryDelay, secondsUntil, toBackendStatus } from './use-health-monitor'

describe('getRetryDelay', () => {
  it('uses the normal poll interval without a failure', () => {
    expect(getRetryDelay(0)).toBe(HEALTH_POLL_INTERVAL_MS)
  })

  it('doubles the delay after each failure', () => {
    expect(getRetryDelay(1)).toBe(HEALTH_RETRY_BASE_MS)
    expect(getRetryDelay(2)).toBe(HEALTH_RETRY_BASE_MS * 2)
    expect(getRetryDelay(3)).toBe(HEALTH_RETRY_BASE_MS * 4)
  })

  it('never waits longer than the maximum', () => {
    expect(getRetryDelay(5)).toBe(HEALTH_RETRY_MAX_MS)
    expect(getRetryDelay(50)).toBe(HEALTH_RETRY_MAX_MS)
  })
})

describe('secondsUntil', () => {
  it('rounds a part of a second up', () => {
    expect(secondsUntil(10_001, 0)).toBe(11)
    expect(secondsUntil(10_000, 0)).toBe(10)
  })

  it('returns 0 for a time in the past', () => {
    expect(secondsUntil(1000, 5000)).toBe(0)
  })
})

describe('toBackendStatus', () => {
  it('maps the offline flag to the store status', () => {
    expect(toBackendStatus(true)).toBe('disconnected')
    expect(toBackendStatus(false)).toBe('connected')
  })
})

describe('checkVersion', () => {
  it('records the first real version', () => {
    expect(checkVersion(null, '3.0.0')).toEqual({ initialVersion: '3.0.0', isDrift: false })
  })

  it('reports a drift for another version and keeps the first version', () => {
    expect(checkVersion('3.0.0', '3.0.1')).toEqual({ initialVersion: '3.0.0', isDrift: true })
  })

  it('reports no drift for the same version', () => {
    expect(checkVersion('3.0.0', '3.0.0')).toEqual({ initialVersion: '3.0.0', isDrift: false })
  })

  it('ignores a missing version and the dev version', () => {
    expect(checkVersion(null, undefined)).toEqual({ initialVersion: null, isDrift: false })
    expect(checkVersion(null, 'dev')).toEqual({ initialVersion: null, isDrift: false })
    expect(checkVersion('3.0.0', 'dev')).toEqual({ initialVersion: '3.0.0', isDrift: false })
    expect(checkVersion('3.0.0', '')).toEqual({ initialVersion: '3.0.0', isDrift: false })
  })
})
