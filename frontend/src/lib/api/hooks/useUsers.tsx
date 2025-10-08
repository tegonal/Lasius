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

import { SelectAutocompleteSuggestionType } from 'components/ui/forms/input/InputSelectAutocomplete'
import { useGetOrganisationUserList } from 'lib/api/lasius/organisations/organisations'
import { orderBy } from 'lodash'

/**
 * Hook for managing user data and suggestions
 *
 * @returns Object containing:
 *   - userSuggestions: Function to get formatted user suggestions for autocomplete
 *   - findUserById: Function to find any user by ID
 *
 * @example
 * const { userSuggestions, findUserById } = useUsers(organisationId)
 *
 * // Get users for autocomplete
 * const suggestions = userSuggestions()
 *
 * // Find a specific user
 * const user = findUserById('user-id-123')
 */
export const useUsers = (organisationId: string) => {
  const { data: organisationUsers } = useGetOrganisationUserList(organisationId)

  const userSuggestions = (): SelectAutocompleteSuggestionType[] => {
    if (organisationUsers) {
      return orderBy(
        organisationUsers.map((user) => ({
          id: user.id,
          key: user.key,
        })),
        [(data) => data.key],
        ['asc'],
      )
    }
    return []
  }

  const findUserById = (userId: string): SelectAutocompleteSuggestionType | undefined => {
    if (!organisationUsers || !userId) return undefined

    const user = organisationUsers.find((u) => u.id === userId)
    if (user) {
      return {
        id: user.id,
        key: user.key,
      }
    }
    return undefined
  }

  return {
    userSuggestions,
    findUserById,
  }
}
