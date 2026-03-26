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

const APP_SETTINGS_STORAGE_KEY = 'lasius-app-settings'

export type ThemeMode = 'dark' | 'light' | 'system'

interface AppSettingsStore {
  dismissOnboarding: () => void
  markChecklistReached: () => void
  onboardingChecklistReached: boolean
  onboardingDismissed: boolean
  resetOnboarding: () => void
  setTheme: (theme: ThemeMode) => void
  theme: ThemeMode
}

export const useAppSettingsStore = create<AppSettingsStore>()(
  devtools(
    persist(
      immer((set) => ({
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
        setTheme: (theme) =>
          set((state) => {
            state.theme = theme
          }),
        theme: 'system',
      })),
      {
        name: APP_SETTINGS_STORAGE_KEY,
      },
    ),
    {
      name: 'lasius-app-settings-devtools',
    },
  ),
)

export const useTheme = () => useAppSettingsStore((state) => state.theme)
export const useOnboardingDismissed = () =>
  useAppSettingsStore((state) => state.onboardingDismissed)
export const useAppSettingsActions = () => {
  const setTheme = useAppSettingsStore((state) => state.setTheme)
  const dismissOnboarding = useAppSettingsStore(
    (state) => state.dismissOnboarding,
  )
  const resetOnboarding = useAppSettingsStore((state) => state.resetOnboarding)
  const markChecklistReached = useAppSettingsStore(
    (state) => state.markChecklistReached,
  )

  return useMemo(
    () => ({
      dismissOnboarding,
      markChecklistReached,
      resetOnboarding,
      setTheme,
    }),
    [dismissOnboarding, markChecklistReached, resetOnboarding, setTheme],
  )
}
