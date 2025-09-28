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

import { useCalendarStore } from './calendarStore'
import { useOrganisationStore } from './organisationStore'
import { useUIStore } from './uiStore'

/**
 * Reset all stores to their initial state
 * Used on logout/signout
 */
export const resetAllStores = () => {
  // Reset UI store
  useUIStore.getState().clearModals()
  useUIStore.getState().clearToasts()
  useUIStore.getState().clearTabs()
  useUIStore.getState().closeContextMenu()

  // Reset calendar store
  useCalendarStore.getState().resetCalendar()

  // Reset organisation store
  useOrganisationStore.getState().resetOrganisation()

  // Clear persisted storage
  localStorage.removeItem('lasius-calendar-store')
  localStorage.removeItem('lasius-organisation-store')
}

/**
 * Hook to get the reset function
 */
export const useResetStores = () => {
  return resetAllStores
}
