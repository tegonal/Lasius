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

import { ModelsUser, ModelsUserOrganisation, ModelsUserSettings } from 'lib/api/lasius'
import { updateUserSettings } from 'lib/api/lasius/user/user'
import { ROLES } from 'projectConfig/constants'
import { mutate } from 'swr'
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface OrganisationStore {
  // Selected organisation ID
  selectedOrganisationId: string
  setSelectedOrganisationId: (id: string) => void

  // Previous organisation ID (for tracking changes)
  previousOrganisationId: string

  // Organisation switching state
  isSwitchingOrganisation: boolean
  setIsSwitchingOrganisation: (switching: boolean) => void

  // Cached organisations list
  organisations: ModelsUserOrganisation[]
  setOrganisations: (organisations: ModelsUserOrganisation[]) => void

  // Cached user settings (needed for mutations)
  userSettings: ModelsUserSettings | null
  setUserSettings: (settings: ModelsUserSettings) => void

  // Sync from profile data (called when profile fetches)
  syncFromProfile: (profile: ModelsUser) => void

  // Helper to switch organisation with loading state
  switchOrganisation: (newId: string) => Promise<void>

  // Reset organisation state
  resetOrganisation: () => void
}

export const useOrganisationStore = create<OrganisationStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Selected organisation ID
          selectedOrganisationId: '',
          previousOrganisationId: '',
          isSwitchingOrganisation: false,
          organisations: [],
          userSettings: null,

          setSelectedOrganisationId: (id) =>
            set((state) => {
              state.previousOrganisationId = state.selectedOrganisationId
              state.selectedOrganisationId = id
            }),

          setIsSwitchingOrganisation: (switching) =>
            set((state) => {
              state.isSwitchingOrganisation = switching
            }),

          setOrganisations: (organisations) =>
            set((state) => {
              state.organisations = organisations
            }),

          setUserSettings: (settings) =>
            set((state) => {
              state.userSettings = settings
            }),

          syncFromProfile: (profile) =>
            set((state) => {
              // Update organisations
              if (profile.organisations) {
                state.organisations = profile.organisations
              }

              // Update user settings
              if (profile.settings) {
                state.userSettings = profile.settings
              }

              // Initialize selectedOrganisationId if not set
              if (!state.selectedOrganisationId) {
                if (profile.settings?.lastSelectedOrganisation?.id) {
                  state.previousOrganisationId = state.selectedOrganisationId
                  state.selectedOrganisationId = profile.settings.lastSelectedOrganisation.id
                } else if (profile.organisations) {
                  // Fallback to private organisation
                  const myPrivateOrg = profile.organisations.find(
                    (item) => item.private,
                  )?.organisationReference
                  if (myPrivateOrg && state.userSettings) {
                    state.previousOrganisationId = state.selectedOrganisationId
                    state.selectedOrganisationId = myPrivateOrg.id

                    // Update backend settings to persist the auto-selected organisation
                    const updatedSettings: ModelsUserSettings = {
                      ...state.userSettings,
                      lastSelectedOrganisation: myPrivateOrg,
                    }
                    state.userSettings = updatedSettings

                    // Persist to backend asynchronously and update SWR cache
                    updateUserSettings(updatedSettings)
                      .then((updatedProfile) => {
                        // Update SWR cache with the new profile
                        mutate('/user/profile', updatedProfile, false)
                        // Reload page to ensure all data is loaded with correct organisation
                        // This only happens when auto-selecting default organisation on first load
                        if (typeof window !== 'undefined') {
                          window.location.reload()
                        }
                      })
                      .catch((error) => {
                        console.error('Failed to persist auto-selected organisation:', error)
                      })
                  }
                }
              }
            }),

          switchOrganisation: async (newId) => {
            const currentId = get().selectedOrganisationId

            // Don't switch if it's the same organisation
            if (currentId === newId) {
              return
            }

            // Set switching state
            get().setIsSwitchingOrganisation(true)

            // Update the organisation ID
            get().setSelectedOrganisationId(newId)

            // Wait a tick for state to propagate
            await new Promise((resolve) => setTimeout(resolve, 0))

            // Clear switching state
            get().setIsSwitchingOrganisation(false)
          },

          resetOrganisation: () =>
            set((state) => {
              state.selectedOrganisationId = ''
              state.previousOrganisationId = ''
              state.isSwitchingOrganisation = false
              state.organisations = []
              state.userSettings = null
            }),
        })),
      ),
      {
        name: 'lasius-organisation-store',
        // Only persist the selectedOrganisationId
        partialize: (state) => ({ selectedOrganisationId: state.selectedOrganisationId }),
      },
    ),
    {
      name: 'lasius-organisation-store',
    },
  ),
)

// Selector hooks for performance optimization
export const useSelectedOrganisationId = () =>
  useOrganisationStore((state) => state.selectedOrganisationId)

export const useIsSwitchingOrganisation = () =>
  useOrganisationStore((state) => state.isSwitchingOrganisation)

export const usePreviousOrganisationId = () =>
  useOrganisationStore((state) => state.previousOrganisationId)

export const useOrganisations = () => useOrganisationStore((state) => state.organisations)

// Computed selector for isAdministrator based on cached data
export const useIsAdministrator = () => {
  const selectedOrganisationId = useSelectedOrganisationId()
  const organisations = useOrganisations()

  const selectedOrganisation = organisations.find(
    (org) => org.organisationReference.id === selectedOrganisationId,
  )

  return selectedOrganisation?.role === ROLES.ORGANISATION_ADMIN
}

// Action hooks
export const useOrganisationActions = () => {
  const setSelectedOrganisationId = useOrganisationStore((state) => state.setSelectedOrganisationId)
  const switchOrganisation = useOrganisationStore((state) => state.switchOrganisation)
  const resetOrganisation = useOrganisationStore((state) => state.resetOrganisation)

  return {
    setSelectedOrganisationId,
    switchOrganisation,
    resetOrganisation,
  }
}

// Subscribe to organisation changes (useful for side effects)
export const subscribeToOrganisationChanges = (
  listener: (newId: string, previousId: string) => void,
) => {
  return useOrganisationStore.subscribe(
    (state) => state.selectedOrganisationId,
    (newId) => {
      const prevOrgId = useOrganisationStore.getState().previousOrganisationId
      listener(newId, prevOrgId)
    },
  )
}
