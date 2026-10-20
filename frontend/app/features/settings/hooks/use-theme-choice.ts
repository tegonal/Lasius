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

import { useFetcher, useRouteLoaderData } from 'react-router'

import { API_ROUTES } from '~/config/constants'
import { readPrefersDark, themeToApply } from '~/features/settings/lib/resolve-theme'
import { type loader as rootLoader } from '~/root'

type ThemeChoice = 'dark' | 'light' | 'system'

/** The theme choice from the `theme` cookie, and a function that applies and stores a new choice. */
export const useThemeChoice = () => {
  const theme: ThemeChoice =
    useRouteLoaderData<typeof rootLoader>('root')?.themePreference ?? 'system'
  const { submit } = useFetcher()

  // The inline script in root.tsx resolves 'system' on each load.
  const applyTheme = (choice: ThemeChoice): void => {
    const resolvedTheme = themeToApply(choice, readPrefersDark())
    if (resolvedTheme) document.documentElement.dataset.theme = resolvedTheme
    void submit({ theme: choice }, { action: API_ROUTES.THEME, method: 'post' })
  }

  return { applyTheme, theme }
}
