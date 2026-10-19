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

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cachedServerLoader, clearLoaderCache } from './loader-cache'

const WEEK_ROUTE = 'routes/user.dashboard.week'
const WEEK_URL = 'http://test/user/dashboard/week?date=1'

const request = (url: string) => new Request(url)

describe('cachedServerLoader', () => {
  beforeEach(() => clearLoaderCache())

  it('returns the cached result for the same route and URL', async () => {
    const serverLoader = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')

    await cachedServerLoader(WEEK_ROUTE, request(WEEK_URL), serverLoader)
    const result = await cachedServerLoader(WEEK_ROUTE, request(WEEK_URL), serverLoader)

    expect(result).toBe('first')
    expect(serverLoader).toHaveBeenCalledTimes(1)
  })

  it('keeps a layout route and its child route apart for the same URL', async () => {
    const url = 'http://test/user/stats/projects?from=a&to=b'
    const childLoader = vi.fn().mockResolvedValue('child')
    const layoutLoader = vi.fn().mockResolvedValue('layout')

    await cachedServerLoader('routes/user.stats.projects', request(url), childLoader)
    await cachedServerLoader('routes/user.stats', request(url), layoutLoader)
    const result = await cachedServerLoader('routes/user.stats.projects', request(url), childLoader)

    expect(result).toBe('child')
    expect(childLoader).toHaveBeenCalledTimes(1)
    expect(layoutLoader).toHaveBeenCalledTimes(1)
  })

  it('calls the server loader again after clearLoaderCache', async () => {
    const serverLoader = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')

    await cachedServerLoader(WEEK_ROUTE, request(WEEK_URL), serverLoader)
    clearLoaderCache()
    const result = await cachedServerLoader(WEEK_ROUTE, request(WEEK_URL), serverLoader)

    expect(result).toBe('second')
    expect(serverLoader).toHaveBeenCalledTimes(2)
  })

  it('does not store a result whose request was in flight during clearLoaderCache', async () => {
    let resolveFirst: (value: string) => void = () => {}
    const serverLoader = vi
      .fn()
      .mockReturnValueOnce(new Promise<string>((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce('fresh')

    const pending = cachedServerLoader(WEEK_ROUTE, request(WEEK_URL), serverLoader)
    clearLoaderCache()
    resolveFirst('stale')
    expect(await pending).toBe('stale')

    const result = await cachedServerLoader(WEEK_ROUTE, request(WEEK_URL), serverLoader)
    expect(result).toBe('fresh')
  })
})
