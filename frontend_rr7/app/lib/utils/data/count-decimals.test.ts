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

import { countDecimals } from './count-decimals'

describe('countDecimals', () => {
  describe('integers', () => {
    it('returns 0 for zero', () => {
      expect(countDecimals(0)).toBe(0)
    })

    it('returns 0 for positive integers', () => {
      expect(countDecimals(10)).toBe(0)
    })

    it('returns 0 for negative integers', () => {
      expect(countDecimals(-5)).toBe(0)
    })
  })

  describe('decimals', () => {
    it('returns 2 for 1.23', () => {
      expect(countDecimals(1.23)).toBe(2)
    })

    it('returns 1 for 0.1', () => {
      expect(countDecimals(0.1)).toBe(1)
    })

    it('returns 5 for 3.14159', () => {
      expect(countDecimals(3.141_59)).toBe(5)
    })

    it('returns 3 for 0.005', () => {
      expect(countDecimals(0.005)).toBe(3)
    })
  })

  describe('scientific notation', () => {
    it('returns 6 for 5e-6', () => {
      expect(countDecimals(5e-6)).toBe(6)
    })

    it('returns 10 for 1e-10', () => {
      expect(countDecimals(1e-10)).toBe(10)
    })
  })
})
