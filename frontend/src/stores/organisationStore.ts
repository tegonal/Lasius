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

import {
  ModelsEntityReference,
  ModelsUser,
  ModelsUserOrganisation,
  ModelsUserSettings,
} from 'lib/api/lasius'
import { updateUserSettings } from 'lib/api/lasius/user/user'
import { logger } from 'lib/logger'
import { stringHash } from 'lib/utils/string/stringHash'
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

              // Validate selectedOrganisationId against available organisations
              const currentSelectedId = state.selectedOrganisationId
              const isOrgStillAvailable = profile.organisations?.some(
                (org) => org.organisationReference.id === currentSelectedId,
              )

              // Initialize or reset selectedOrganisationId if invalid
              if (!currentSelectedId || !isOrgStillAvailable) {
                // Log for debugging when org is no longer accessible
                if (currentSelectedId && !isOrgStillAvailable) {
                  logger.warn(
                    '[OrganisationStore] Selected organisation no longer accessible, switching to fallback',
                    {
                      selectedId: currentSelectedId,
                      availableOrgs: profile.organisations?.map((o) => ({
                        id: o.organisationReference.id,
                        key: o.organisationReference.key,
                      })),
                    },
                  )
                }

                // Fallback logic: Try these in order
                let fallbackOrg: ModelsEntityReference | undefined

                // 1. Try lastSelectedOrganisation from backend settings (if still exists)
                if (profile.settings?.lastSelectedOrganisation?.id) {
                  const lastSelectedOrg = profile.settings.lastSelectedOrganisation
                  const lastSelectedStillExists = profile.organisations?.find(
                    (org) => org.organisationReference.id === lastSelectedOrg.id,
                  )
                  if (lastSelectedStillExists) {
                    fallbackOrg = lastSelectedOrg
                    logger.info('[OrganisationStore] Using lastSelectedOrganisation from backend', {
                      orgId: fallbackOrg.id,
                      orgKey: fallbackOrg.key,
                    })
                  }
                }

                // 2. Try private organisation
                if (!fallbackOrg) {
                  const privateOrg = profile.organisations?.find((org) => org.private)
                  if (privateOrg) {
                    fallbackOrg = privateOrg.organisationReference
                    logger.info('[OrganisationStore] Falling back to private organisation', {
                      orgId: fallbackOrg.id,
                      orgKey: fallbackOrg.key,
                    })
                  }
                }

                // 3. Try first available organisation
                if (!fallbackOrg && profile.organisations && profile.organisations.length > 0) {
                  fallbackOrg = profile.organisations[0].organisationReference
                  logger.info('[OrganisationStore] Falling back to first available organisation', {
                    orgId: fallbackOrg.id,
                    orgKey: fallbackOrg.key,
                  })
                }

                // Set fallback organisation
                if (fallbackOrg) {
                  const previousOrgId = state.selectedOrganisationId
                  state.previousOrganisationId = previousOrgId
                  state.selectedOrganisationId = fallbackOrg.id

                  // Show toast notification if org was switched (not first load)
                  if (previousOrgId && previousOrgId !== fallbackOrg.id) {
                    const toastMessage = `Switched to ${fallbackOrg.key} organisation`
                    // Import toast dynamically to avoid circular dependencies
                    // Note: Cannot use useToast() hook here because this runs outside React components
                    import('stores/uiStore')
                      .then(({ useUIStore }) => {
                        useUIStore.getState().addToast({
                          id: stringHash({ message: toastMessage, type: 'NOTIFICATION' }),
                          message: toastMessage,
                          type: 'NOTIFICATION',
                          ttl: 5000,
                        })
                      })
                      .catch((error) => {
                        logger.error('[OrganisationStore] Failed to show toast:', error)
                      })
                  }

                  // Update backend settings to persist the fallback
                  if (state.userSettings) {
                    const updatedSettings: ModelsUserSettings = {
                      ...state.userSettings,
                      lastSelectedOrganisation: fallbackOrg,
                    }
                    state.userSettings = updatedSettings

                    // Persist to backend asynchronously
                    updateUserSettings(updatedSettings)
                      .then((updatedProfile) => {
                        // Update SWR cache with the new profile
                        mutate('/user/profile', updatedProfile, false)
                        logger.info(
                          '[OrganisationStore] Fallback organisation persisted to backend',
                        )

                        // Only reload page on first load (when previousOrgId was empty)
                        if (!previousOrgId && typeof window !== 'undefined') {
                          logger.info(
                            '[OrganisationStore] Reloading page for initial organisation setup',
                          )
                          window.location.reload()
                        }
                      })
                      .catch((error) => {
                        logger.error(
                          '[OrganisationStore] Failed to persist fallback organisation:',
                          error,
                        )
                      })
                  }
                } else {
                  logger.error('[OrganisationStore] No fallback organisation available', {
                    profileOrgs: profile.organisations?.length || 0,
                  })
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
