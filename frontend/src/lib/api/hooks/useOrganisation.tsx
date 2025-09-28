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

import { useProfile } from 'lib/api/hooks/useProfile'
import { ModelsEntityReference } from 'lib/api/lasius'
import { ROLES } from 'projectConfig/constants'
import { useCallback, useEffect } from 'react'
import { useOrganisationStore, useSelectedOrganisationId } from 'stores/organisationStore'

export const useOrganisation = () => {
  const { profile: data, updateSettings } = useProfile()

  // Use Zustand store for selectedOrganisationId
  const selectedOrganisationId = useSelectedOrganisationId()
  const setSelectedOrganisationIdStore = useOrganisationStore(
    (state) => state.setSelectedOrganisationId,
  )

  const setSelectedOrganisation = useCallback(
    async (organisationReference: ModelsEntityReference) => {
      if (organisationReference) {
        // Update both backend and local store
        await updateSettings({ lastSelectedOrganisation: organisationReference })
        setSelectedOrganisationIdStore(organisationReference.id)
      }
    },
    [updateSettings, setSelectedOrganisationIdStore],
  )

  // Initialize organisation ID on first load if not set
  useEffect(() => {
    if (!selectedOrganisationId && data?.settings.lastSelectedOrganisation?.id) {
      // Set from user's lastSelectedOrganisation
      setSelectedOrganisationIdStore(data.settings.lastSelectedOrganisation.id)
    } else if (!selectedOrganisationId && data?.organisations) {
      // Fallback to private organisation
      const myPrivateOrg = data.organisations.filter((item) => item.private)[0]
        ?.organisationReference
      if (myPrivateOrg) {
        setSelectedOrganisationIdStore(myPrivateOrg.id)
        // Also update backend
        setSelectedOrganisation(myPrivateOrg)
      }
    }
  }, [data, selectedOrganisationId, setSelectedOrganisationIdStore, setSelectedOrganisation])

  const selectedOrganisation = data?.organisations.find(
    (org) => org.organisationReference.id === selectedOrganisationId,
  )

  return {
    selectedOrganisationId: selectedOrganisationId || '',
    selectedOrganisationKey: selectedOrganisation?.organisationReference?.key || '',
    selectedOrganisation,
    organisations: data?.organisations || [],
    setSelectedOrganisation,
    isAdministrator: selectedOrganisation?.role === ROLES.ORGANISATION_ADMIN,
  }
}
