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

import { useEffect, useState } from 'react'

type ColorMode = 'light' | 'dark'

/**
 * Custom hook for managing and observing the application's color mode (light/dark theme).
 * Automatically syncs with the data-theme attribute on the document root element
 * and listens for external theme changes.
 *
 * @returns A tuple containing:
 *   - The current color mode ('light' or 'dark')
 *   - A setter function to update the color mode
 *
 * @example
 * const [colorMode, setColorMode] = useColorMode()
 *
 * // Get current mode
 * console.log(colorMode) // 'light' or 'dark'
 *
 * // Toggle theme
 * setColorMode(colorMode === 'light' ? 'dark' : 'light')
 */
export const useColorMode = (): [ColorMode, (mode: ColorMode) => void] => {
  const [mode, setModeState] = useState<ColorMode>('light')

  // Initialize mode from current theme
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    setModeState((currentTheme === 'dark' ? 'dark' : 'light') as ColorMode)

    // Listen for theme changes via MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme')
          setModeState((newTheme === 'dark' ? 'dark' : 'light') as ColorMode)
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  const setMode = (newMode: ColorMode) => {
    document.documentElement.setAttribute('data-theme', newMode)
    setModeState(newMode)
  }

  return [mode, setMode]
}
