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

const subscribeToTheme = (onThemeChange: () => void) => {
  const observer = new MutationObserver(onThemeChange)
  observer.observe(document.documentElement, {
    attributeFilter: ['data-theme'],
    attributes: true,
  })
  return () => observer.disconnect()
}

const getTheme = () => document.documentElement.dataset.theme || 'light'

const getServerTheme = () => 'light'

/** Returns the data-theme attribute of <html>, and renders again when it changes. */
export const useDataTheme = (): string =>
  useSyncExternalStore(subscribeToTheme, getTheme, getServerTheme)
