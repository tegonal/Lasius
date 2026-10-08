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
  nextPersistedParameter,
  readPersistedParameter,
  serializePersistedParameter,
} from './persisted-parameter'

describe('nextPersistedParameter', () => {
  it('keeps the stored fallback when the value is unchanged', () => {
    const raw = serializePersistedParameter('2026-10-01', '2026-10-07')
    expect(nextPersistedParameter(raw, '2026-10-01', '2026-10-08')).toBeNull()
  })

  it('stores a changed value with the current fallback', () => {
    const raw = serializePersistedParameter('2026-10-01', '2026-10-07')
    expect(nextPersistedParameter(raw, '2026-10-05', '2026-10-08')).toBe(
      serializePersistedParameter('2026-10-05', '2026-10-08'),
    )
  })

  it('replaces a missing or plain-string entry', () => {
    const expected = serializePersistedParameter('2026-10-01', '2026-10-08')
    expect(nextPersistedParameter(null, '2026-10-01', '2026-10-08')).toBe(expected)
    expect(nextPersistedParameter('2026-10-01', '2026-10-01', '2026-10-08')).toBe(expected)
  })
})

describe('readPersistedParameter', () => {
  it('restores a selection on the same day', () => {
    const raw = serializePersistedParameter('2026-09-28', '2026-10-08')
    expect(readPersistedParameter(raw, '2026-10-08')).toBe('2026-09-28')
  })

  it('drops a selection from an earlier day', () => {
    const raw = serializePersistedParameter('2026-09-28', '2026-10-07')
    expect(readPersistedParameter(raw, '2026-10-08')).toBeNull()
  })

  it('drops a value of the earlier plain-string format', () => {
    expect(readPersistedParameter('2026-09-28', '2026-10-08')).toBeNull()
  })

  it('drops a missing, empty or malformed value', () => {
    expect(readPersistedParameter(null, '2026-10-08')).toBeNull()
    expect(readPersistedParameter('', '2026-10-08')).toBeNull()
    expect(readPersistedParameter('{"fallback":"2026-10-08"}', '2026-10-08')).toBeNull()
    expect(readPersistedParameter('{"fallback":"2026-10-08","value":5}', '2026-10-08')).toBeNull()
  })
})
