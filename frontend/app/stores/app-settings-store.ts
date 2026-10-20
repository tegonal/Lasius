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

import { useMemo } from 'react'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { API_ROUTES } from '~/config/constants'
import { logger } from '~/lib/logger'

const APP_SETTINGS_STORAGE_KEY = 'lasius-app-settings'

interface AppSettingsStore {
  dismissOnboarding: () => void
  markChecklistReached: () => void
  onboardingChecklistReached: boolean
  onboardingDismissed: boolean
  resetOnboarding: () => void
}

const appSettingsState = immer<AppSettingsStore>((set) => ({
  dismissOnboarding: () =>
    set((state) => {
      state.onboardingDismissed = true
    }),
  markChecklistReached: () =>
    set((state) => {
      state.onboardingChecklistReached = true
    }),
  onboardingChecklistReached: false,
  onboardingDismissed: false,
  resetOnboarding: () =>
    set((state) => {
      state.onboardingDismissed = false
      state.onboardingChecklistReached = false
    }),
}))

/**
 * The old inline script wrote the resolved light or dark to the `theme` cookie, so a stored
 * 'system' choice was only in this store. This puts the choice back into the cookie.
 */
const restoreSystemThemeChoice = () => {
  void fetch(API_ROUTES.THEME, {
    body: new URLSearchParams({ theme: 'system' }),
    method: 'POST',
  }).catch((error: unknown) => {
    logger.warn('Failed to restore the system theme choice', error)
  })
  const isPrefersDark = matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.dataset.theme = isPrefersDark ? 'dark' : 'light'
}

export const useAppSettingsStore = create<AppSettingsStore>()(
  devtools(
    persist(appSettingsState, {
      // Version 0 also stored the theme. The `theme` cookie holds it now, so the migration drops it.
      migrate: (persisted) => {
        const { theme, ...rest } = (persisted ?? {}) as Record<string, unknown>
        if (theme === 'system') restoreSystemThemeChoice()
        return rest as Partial<AppSettingsStore> as AppSettingsStore
      },
      name: APP_SETTINGS_STORAGE_KEY,
      version: 1,
    }),
    {
      name: 'lasius-app-settings-devtools',
    },
  ),
)

export const useIsOnboardingDismissed = () =>
  useAppSettingsStore((state) => state.onboardingDismissed)
export const useAppSettingsActions = () => {
  const dismissOnboarding = useAppSettingsStore((state) => state.dismissOnboarding)
  const resetOnboarding = useAppSettingsStore((state) => state.resetOnboarding)
  const markChecklistReached = useAppSettingsStore((state) => state.markChecklistReached)

  return useMemo(
    () => ({
      dismissOnboarding,
      markChecklistReached,
      resetOnboarding,
    }),
    [dismissOnboarding, markChecklistReached, resetOnboarding],
  )
}
