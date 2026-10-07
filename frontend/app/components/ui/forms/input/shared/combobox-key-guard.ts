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

type GuardedKeyEvent = {
  key: string
  preventBaseUIHandler: () => void
  preventDefault: () => void
}

/**
 * Keeps two keyboard rules of the former Headless UI comboboxes for a Base UI `Combobox.Input`.
 * Pass it as `onKeyDown`; it runs before the Base UI handler. `isListOpen` is the list that the
 * user opened, not a list that shows on focus.
 */
export const guardComboboxKey = (event: GuardedKeyEvent, isListOpen: boolean): void => {
  // Base UI lets Enter submit the form when no item is highlighted.
  if (event.key === 'Enter' && isListOpen) {
    event.preventDefault()
    return
  }

  // On a closed list, Base UI clears the selection and stops the event, so a dialog stays open.
  if (event.key === 'Escape' && !isListOpen) {
    event.preventBaseUIHandler()
  }
}
