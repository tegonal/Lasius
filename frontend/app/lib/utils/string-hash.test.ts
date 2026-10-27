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

import { stringHash } from './string-hash'

describe('stringHash', () => {
  it('returns a string', () => {
    expect(typeof stringHash({ a: 1 })).toBe('string')
  })

  it('returns the same hash for identical objects', () => {
    const object = { name: 'test', value: 42 }
    expect(stringHash(object)).toBe(stringHash(object))
  })

  it('returns different hashes for different objects', () => {
    expect(stringHash({ a: 1 })).not.toBe(stringHash({ a: 2 }))
  })

  it('returns a deterministic hash for empty object', () => {
    const hash = stringHash({})
    expect(hash).toBeTruthy()
    expect(hash).toBe(stringHash({}))
  })

  it('handles nested objects', () => {
    const nested = { a: { b: { c: 1 } } }
    const hash = stringHash(nested)
    expect(hash).toBeTruthy()
    expect(hash).toBe(stringHash(nested))
  })

  it('returns different hashes for objects that differ only in a nested value', () => {
    const row = (userId: string) => ({
      day: '2026-10-26',
      userReference: { id: userId, key: userId },
    })
    expect(stringHash(row('mc'))).not.toBe(stringHash(row('ms')))
  })

  it('returns different hashes for objects that differ only in a value inside an array', () => {
    expect(stringHash({ tags: [{ id: 'TT' }] })).not.toBe(stringHash({ tags: [{ id: 'Remote' }] }))
  })

  it('ignores the key order at every level', () => {
    // JSON strings keep the key order. The lint autofix sorts the keys of an object literal.
    const first: unknown = JSON.parse('{"a":{"x":1,"y":2},"b":1}')
    const second: unknown = JSON.parse('{"b":1,"a":{"y":2,"x":1}}')
    expect(stringHash(first)).toBe(stringHash(second))
  })

  it('handles arrays', () => {
    const array = [1, 2, 3]
    const hash = stringHash(array)
    expect(hash).toBeTruthy()
  })

  it('produces consistent results across calls', () => {
    const data = { project: 'abc', tags: ['x', 'y'] }
    const first = stringHash(data)
    const second = stringHash(data)
    expect(first).toBe(second)
  })
})
