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

import { ModelsAcceptTOSRequest, ModelsUserSettings } from 'lib/api/lasius'
import { acceptUserTOS, updateUserSettings, useGetUserProfile } from 'lib/api/lasius/user/user'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useOrganisationStore } from 'stores/organisationStore'

/**
 * Custom hook for managing the current user's profile data and authentication state.
 * Fetches and syncs user profile information with the organisation store,
 * and provides methods for updating settings and accepting Terms of Service.
 *
 * @returns Object containing:
 *   - firstName: User's first name
 *   - lastName: User's last name
 *   - email: User's email address
 *   - role: User's role in the system
 *   - profile: Complete user profile data
 *   - userId: User's unique identifier
 *   - lasiusIsLoggedIn: Boolean indicating if user is authenticated
 *   - updateSettings: Function to update user settings
 *   - acceptedTOSVersion: Version of TOS the user has accepted
 *   - acceptTOS: Function to accept a new TOS version
 *
 * @example
 * const { profile, lasiusIsLoggedIn, updateSettings } = useProfile()
 *
 * if (!lasiusIsLoggedIn) {
 *   return <LoginPrompt />
 * }
 *
 * await updateSettings({ theme: 'dark' })
 */
export const useProfile = () => {
  const session = useSession()
  const [enabled, setEnabled] = useState(false)
  const syncFromProfile = useOrganisationStore((state) => state.syncFromProfile)

  useEffect(() => {
    setEnabled(session.data?.access_token !== undefined)
  }, [session.data?.access_token])

  const { data, mutate } = useGetUserProfile({
    swr: {
      enabled: enabled,
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
    },
  })

  // Sync organisation store whenever profile data changes
  useEffect(() => {
    if (data) {
      syncFromProfile(data)
    }
  }, [data, syncFromProfile])

  const updateSettings = async (updateData: Partial<ModelsUserSettings>) => {
    if (data) {
      const modifiedSettings: ModelsUserSettings = { ...data.settings, ...updateData }
      const profile = await updateUserSettings(modifiedSettings)
      await mutate(profile)
    }
  }

  const acceptTOS = async (currentTOSVersion: string) => {
    if (data) {
      try {
        const acceptTOSRequest: ModelsAcceptTOSRequest = { version: currentTOSVersion }
        const profile = await acceptUserTOS(acceptTOSRequest)
        await mutate(profile)
      } catch (error) {
        console.error('Failed to accept TOS:', error)
        throw error
      }
    }
  }

  return {
    firstName: data?.firstName || '',
    lastName: data?.lastName || '',
    email: data?.email || '',
    role: data?.role || '',
    profile: data,
    userId: data?.id || '',
    lasiusIsLoggedIn: !!data,
    updateSettings,
    acceptedTOSVersion: data?.acceptedTOS?.version || '',
    acceptTOS,
  }
}
