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

import { getExpectedVsBookedPercentage } from './get-expected-vs-booked-percentage'

describe('getExpectedVsBookedPercentage', () => {
  it('returns both zero when expected and worked are 0', () => {
    const result = getExpectedVsBookedPercentage(0, 0)
    expect(result).toEqual({ fulfilledPercentage: 0, progressBarPercentage: 0 })
  })

  it('returns 100 fulfilled when expected is 0 but worked > 0', () => {
    const result = getExpectedVsBookedPercentage(0, 5)
    expect(result).toEqual({
      fulfilledPercentage: 100,
      progressBarPercentage: 100,
    })
  })

  it('calculates 50% completion correctly', () => {
    const result = getExpectedVsBookedPercentage(10, 5)
    expect(result).toEqual({
      fulfilledPercentage: 50,
      progressBarPercentage: 50,
    })
  })

  it('returns exact 100% when fully completed', () => {
    const result = getExpectedVsBookedPercentage(8, 8)
    expect(result).toEqual({
      fulfilledPercentage: 100,
      progressBarPercentage: 100,
    })
  })

  it('caps progressBar at 100 when over 100%', () => {
    const result = getExpectedVsBookedPercentage(8, 10)
    expect(result.fulfilledPercentage).toBe(125)
    expect(result.progressBarPercentage).toBe(100)
  })

  it('clamps progressBar to 90 when fulfilled is between 90 and 100', () => {
    const result = getExpectedVsBookedPercentage(100, 95)
    expect(result.fulfilledPercentage).toBe(95)
    expect(result.progressBarPercentage).toBe(90)
  })

  it('does not clamp progressBar at exactly 90', () => {
    const result = getExpectedVsBookedPercentage(100, 90)
    expect(result.fulfilledPercentage).toBe(90)
    expect(result.progressBarPercentage).toBe(90)
  })

  it('returns 0 when expected > 0 but worked is 0', () => {
    const result = getExpectedVsBookedPercentage(10, 0)
    expect(result).toEqual({ fulfilledPercentage: 0, progressBarPercentage: 0 })
  })

  it('rounds fulfilled percentage to 2 decimal places', () => {
    const result = getExpectedVsBookedPercentage(3, 1)
    expect(result.fulfilledPercentage).toBe(33.33)
  })
})
