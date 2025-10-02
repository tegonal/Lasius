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

import { useColorMode } from 'lib/hooks/useColorMode'
import { useMemo } from 'react'
import { nivoPalette, nivoPaletteDark } from 'styles/colors'

/**
 * Hash a string to a number
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Get a consistent color from the palette based on a string key
 * Same key will always return the same color
 */
export function getConsistentColor(key: string, isDark: boolean): string {
  // Dark mode uses darker/more muted colors, light mode uses brighter colors
  const palette = isDark ? nivoPaletteDark : nivoPalette
  const hash = hashString(key)
  const index = hash % palette.length
  return palette[index]
}

/**
 * Hook to get the Nivo color function that responds to theme changes
 * Must be used in a React component to react to theme changes
 * Returns a memoized function that stays stable across renders
 */
export function useNivoColors() {
  const [colorMode] = useColorMode()
  const isDark = colorMode === 'dark'

  // Memoize the function so it only changes when theme changes
  return useMemo(
    () =>
      (datum: { id: string | number }): string => {
        return getConsistentColor(String(datum.id), isDark)
      },
    [isDark],
  )
}
