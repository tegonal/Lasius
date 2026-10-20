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

import { useSyncExternalStore } from 'react'

const TICK_INTERVAL_MS = 25_000
const MS_PER_MINUTE = 60_000

const subscribeToTicks = (onTick: () => void) => {
  const interval = setInterval(onTick, TICK_INTERVAL_MS)
  return () => clearInterval(interval)
}

// The snapshot changes once per minute, so a render between two ticks reads the same value.
const getCurrentMinute = () => Math.floor(Date.now() / MS_PER_MINUTE)

// The server clock differs from the browser clock, so the server render shows no running time.
const getServerMinute = () => null

/** Returns the current time to the minute, or the epoch in the server render. */
export const useCurrentMinute = (): Date => {
  const currentMinute = useSyncExternalStore(subscribeToTicks, getCurrentMinute, getServerMinute)
  return new Date(currentMinute === null ? 0 : currentMinute * MS_PER_MINUTE)
}
