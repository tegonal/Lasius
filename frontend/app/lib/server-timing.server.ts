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

export type ServerTimingEntry = { duration: number; name: string }

/** Formats entries as a `Server-Timing` header value, for example `context;dur=6.1, day;dur=11.0`. */
export const formatServerTiming = (entries: ServerTimingEntry[]) =>
  entries.map(({ duration, name }) => `${name};dur=${duration.toFixed(1)}`).join(', ')

/**
 * Collects the durations of the backend calls of one loader. The browser network panel shows the
 * header under Timing, so a slow page shows which call costs the time.
 */
export const createServerTiming = () => {
  const start = performance.now()
  const entries: ServerTimingEntry[] = []

  return {
    header: () =>
      formatServerTiming([...entries, { duration: performance.now() - start, name: 'total' }]),
    measure: async <T>(name: string, promise: Promise<T>): Promise<T> => {
      const callStart = performance.now()
      try {
        return await promise
      } finally {
        entries.push({ duration: performance.now() - callStart, name })
      }
    },
  }
}
