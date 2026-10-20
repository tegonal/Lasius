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

type ThemeChoice = 'dark' | 'light' | 'system'

/** Returns the theme for the `data-theme` attribute. 'system' resolves to the colour scheme of the device. */
export const resolveTheme = (choice: ThemeChoice, isPrefersDark: boolean): 'dark' | 'light' => {
  if (choice !== 'system') {
    return choice
  }
  return isPrefersDark ? 'dark' : 'light'
}

/** The colour scheme of the device, or null without matchMedia. */
export const readPrefersDark = (): boolean | null =>
  globalThis.window !== undefined && typeof matchMedia === 'function'
    ? matchMedia('(prefers-color-scheme: dark)').matches
    : null

/**
 * The theme to set on the page. It is null for 'system' when the colour scheme of the device is
 * unknown, so the form then leaves the attribute as it is.
 */
export const themeToApply = (
  choice: ThemeChoice,
  prefersDark: boolean | null,
): 'dark' | 'light' | null =>
  choice === 'system' && prefersDark === null ? null : resolveTheme(choice, prefersDark ?? false)
