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

import { isWebSocketOutEvent } from './type-guards'

describe('isWebSocketOutEvent', () => {
  it('returns true for objects with a type property', () => {
    expect(isWebSocketOutEvent({ type: 'Pong' })).toBe(true)
  })

  it('returns false for null', () => {
    expect(isWebSocketOutEvent(null)).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(isWebSocketOutEvent('string')).toBe(false)
    expect(isWebSocketOutEvent(42)).toBe(false)
    expect(isWebSocketOutEvent()).toBe(false)
  })

  it('returns false for objects without type', () => {
    expect(isWebSocketOutEvent({ data: 'foo' })).toBe(false)
  })
})
