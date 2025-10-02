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
 *   - projectSuggestions: Function returning sorted project references for autocomplete (active projects only)
 *   - userProjects: Function returning full sorted array of user projects
 *   - findProjectById: Function to find any project by ID (including inactive projects from any organization)
 *
 * @example
 * const { projectSuggestions, userProjects, findProjectById } = useProjects()
 *
 * // Get projects for autocomplete
 * const suggestions = projectSuggestions()
 *
 * // Get full project list
 * const allProjects = userProjects()
 *
 * // Find a specific project (even if inactive)
 * const project = findProjectById('project-id-123')
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

  /**
   * Finds a project by ID across all organizations in the user's profile.
   * This includes inactive/deactivated projects.
   *
   * @param projectId - The ID of the project to find
   * @returns The project reference or undefined if not found
   */
  const findProjectById = (projectId: string): SelectAutocompleteSuggestionType | undefined => {
    if (!profile?.organisations || !projectId) return undefined

    // Search through all organizations (not just the selected one)
    for (const org of profile.organisations) {
      const project = org.projects.find((p) => p.projectReference.id === projectId)
      if (project) {
        return project.projectReference
      }
    }

    return undefined
  }

  return {
    projectSuggestions,
    userProjects,
    findProjectById,
  }
}
