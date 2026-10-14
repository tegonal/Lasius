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

import { createServerTiming, formatServerTiming } from './server-timing.server'

describe('formatServerTiming', () => {
  it('writes each entry with one decimal, separated by a comma', () => {
    expect(
      formatServerTiming([
        { duration: 6.123, name: 'context' },
        { duration: 11, name: 'day' },
      ]),
    ).toBe('context;dur=6.1, day;dur=11.0')
  })

  it('returns an empty string without entries', () => {
    expect(formatServerTiming([])).toBe('')
  })
})

describe('createServerTiming', () => {
  it('records a measured call and appends the total', async () => {
    const timing = createServerTiming()
    await expect(timing.measure('day', Promise.resolve(42))).resolves.toBe(42)
    expect(timing.header()).toMatch(/^day;dur=\d+\.\d, total;dur=\d+\.\d$/)
  })

  it('records a call that fails and passes the error on', async () => {
    const timing = createServerTiming()
    const failure = Promise.reject(new Error('down'))
    await expect(timing.measure('profile', failure)).rejects.toThrow('down')
    expect(timing.header()).toMatch(/^profile;dur=/)
  })
})
