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
import { orderBy } from 'es-toolkit'
import { useProfile } from 'lib/api/hooks/useProfile'
import { ModelsUserProject } from 'lib/api/lasius'

/**
 * Custom hook for accessing projects from the currently selected organisation.
 * Provides formatted project data for autocomplete inputs and full project lists.
 *
 * @returns Object containing:
 *   - projectSuggestions: Function returning sorted project references for autocomplete
 *   - userProjects: Function returning full sorted array of user projects
 *
 * @example
 * const { projectSuggestions, userProjects } = useProjects()
 *
 * // Get projects for autocomplete
 * const suggestions = projectSuggestions()
 *
 * // Get full project list
 * const allProjects = userProjects()
 */
export const useProjects = () => {
  const { profile } = useProfile()
  const projectSuggestions = (): SelectAutocompleteSuggestionType[] => {
    if (profile?.organisations) {
      const org = profile.organisations.find(
        (item) => item.organisationReference.id === profile.settings?.lastSelectedOrganisation?.id,
      )
      return orderBy(
        org?.projects.map((item) => item.projectReference) || [],
        [(data) => data.key],
        ['asc'],
      )
    }
    return []
  }

  const userProjects = (): ModelsUserProject[] => {
    if (profile?.organisations) {
      const org = profile?.organisations.find(
        (item) => item.organisationReference.id === profile.settings?.lastSelectedOrganisation?.id,
      )
      return orderBy(org?.projects || [], [(data) => data.projectReference.key], ['asc'])
    }
    return []
  }

  return {
    projectSuggestions,
    userProjects,
  }
}
