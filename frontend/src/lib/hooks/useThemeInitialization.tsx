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

import { useEffect } from 'react'
import { APP_SETTINGS_STORAGE_KEY } from 'stores/appSettingsStore'

/**
 * Hook to initialize and manage theme on app mount.
 * - Checks for saved theme preference in localStorage
 * - Falls back to system preference if no saved theme
 * - Listens for system preference changes (only when no manual preference set)
 *
 * This should be called once at the app level (_app.tsx).
 */
export const useThemeInitialization = () => {
  useEffect(() => {
    // Read theme from Zustand persist store
    const getThemeFromStore = (): string | null => {
      try {
        const persistedState = localStorage.getItem(APP_SETTINGS_STORAGE_KEY)
        if (persistedState) {
          const parsed = JSON.parse(persistedState)
          return parsed.state?.theme || null
        }
      } catch {
        // Ignore parsing errors
      }
      return null
    }

    const savedTheme = getThemeFromStore()

    if (savedTheme && savedTheme !== 'system') {
      // User has explicitly set a theme preference (light or dark)
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else {
      // No saved preference or user chose 'system', check system preference
      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const systemTheme = prefersDark ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', systemTheme)
      } else {
        // Fallback to light theme if matchMedia is not supported
        document.documentElement.setAttribute('data-theme', 'light')
      }
    }

    // Listen to system preference changes (only if user chose 'system' or no preference)
    if (
      (!savedTheme || savedTheme === 'system') &&
      typeof window !== 'undefined' &&
      window.matchMedia
    ) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      const handleChange = (e: MediaQueryListEvent) => {
        // Only apply system changes if user hasn't set a manual preference
        const currentTheme = getThemeFromStore()
        if (!currentTheme || currentTheme === 'system') {
          const systemTheme = e.matches ? 'dark' : 'light'
          document.documentElement.setAttribute('data-theme', systemTheme)
        }
      }

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      }
      // Legacy browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange)
        return () => mediaQuery.removeListener(handleChange)
      }
    }
  }, [])
}
