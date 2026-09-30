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

/**
 * Simple client-side cache for loader data.
 * Caches server loader responses keyed by route + search params.
 * Cache is bypassed on full page loads (SSR) — only used on client navigations.
 */

import { LOADER_CACHE_DEFAULT_TTL_MS } from '~/config/constants'

const cache = new Map<string, { data: unknown; timestamp: number }>()

export async function cachedServerLoader<T>(
  request: Request,
  serverLoader: () => Promise<T>,
  ttl = LOADER_CACHE_DEFAULT_TTL_MS,
): Promise<T> {
  const url = new URL(request.url)
  const cacheKey = `${url.pathname}${url.search}`
  const cached = cache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T
  }

  const data = await serverLoader()
  cache.set(cacheKey, { data, timestamp: Date.now() })
  return data
}

export function invalidateLoaderCache(pathPrefix?: string) {
  if (!pathPrefix) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.startsWith(pathPrefix)) {
      cache.delete(key)
    }
  }
}
