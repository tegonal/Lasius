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

import { ModelsEntityReference, ModelsUserSettings } from 'lib/api/lasius'
import { getGetUserProfileKey, updateUserSettings } from 'lib/api/lasius/user/user'
import { ROLES } from 'projectConfig/constants'
import { useCallback } from 'react'
import {
  useOrganisations,
  useOrganisationStore,
  useSelectedOrganisationId,
} from 'stores/organisationStore'
import { mutate } from 'swr'

/**
 * Custom hook for managing organisation selection and organisation-related data.
 * Provides access to the currently selected organisation, all user organisations,
 * and methods to change the active organisation with optimistic updates.
 *
 * @returns Object containing:
 *   - selectedOrganisationId: ID of the currently selected organisation
 *   - selectedOrganisationKey: Key/slug of the selected organisation
 *   - selectedOrganisation: Complete selected organisation object
 *   - organisations: Array of all organisations the user belongs to
 *   - setSelectedOrganisation: Function to change the active organisation
 *   - isAdministrator: Boolean indicating if user is admin of selected org
 *
 * @example
 * const { selectedOrganisation, organisations, setSelectedOrganisation, isAdministrator } = useOrganisation()
 *
 * // Switch organisation
 * await setSelectedOrganisation(organisations[1].organisationReference)
 *
 * // Check admin status
 * if (isAdministrator) {
 *   return <AdminPanel />
 * }
 */
export const useOrganisation = () => {
  // Use Zustand store for all organisation data (no profile fetch!)
  const selectedOrganisationId = useSelectedOrganisationId()
  const organisations = useOrganisations()
  const userSettings = useOrganisationStore((state) => state.userSettings)
  const setSelectedOrganisationIdStore = useOrganisationStore(
    (state) => state.setSelectedOrganisationId,
  )
  const setUserSettings = useOrganisationStore((state) => state.setUserSettings)

  const setSelectedOrganisation = useCallback(
    async (organisationReference: ModelsEntityReference) => {
      if (organisationReference) {
        // Update local store immediately for optimistic update
        setSelectedOrganisationIdStore(organisationReference.id)

        // Build updated settings object
        const updatedSettings: ModelsUserSettings = {
          ...userSettings,
          lastSelectedOrganisation: organisationReference,
        }

        // Update local settings cache optimistically
        setUserSettings(updatedSettings)

        // Update backend
        try {
          await updateUserSettings(updatedSettings)

          // Invalidate profile cache to trigger refetch with new organization data
          await mutate(getGetUserProfileKey())
        } catch (error) {
          // Rollback on error
          console.error('Failed to update organisation:', error)
          // Restore previous settings
          if (userSettings) {
            setUserSettings(userSettings)
          }
        }
      }
    },
    [setSelectedOrganisationIdStore, userSettings, setUserSettings],
  )

  // Compute selectedOrganisation from cached store data
  const selectedOrganisation = organisations.find(
    (org) => org.organisationReference.id === selectedOrganisationId,
  )

  return {
    selectedOrganisationId: selectedOrganisationId || '',
    selectedOrganisationKey: selectedOrganisation?.organisationReference?.key || '',
    selectedOrganisation,
    organisations,
    setSelectedOrganisation,
    isAdministrator: selectedOrganisation?.role === ROLES.ORGANISATION_ADMIN,
  }
}
