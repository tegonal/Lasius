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

import { orderBy } from 'es-toolkit'
import { useMemo } from 'react'

import { useLayoutLoaderData } from '~/hooks/use-layout-loader-data'
import { type ModelsEntityReference } from '~/services/api/lasius/modelsEntityReference'
import { type ModelsUserProject } from '~/services/api/lasius/modelsUserProject'

/**
 * Custom hook for accessing projects from the currently selected organisation.
 * Reads user data from the app-layout route loader (no Zustand/SWR).
 *
 * @returns Object containing:
 *   - userProjects: Function returning full sorted array of user projects
 *   - findProjectById: Function to find any project by ID (including inactive projects from any organization)
 */
export const useProjects = () => {
  const loaderData = useLayoutLoaderData()
  const user = loaderData?.user

  const projects = useMemo((): ModelsUserProject[] => {
    if (user?.organisations) {
      const org = user.organisations.find(
        (item) =>
          item.organisationReference.id ===
          user.settings?.lastSelectedOrganisation?.id,
      )
      return orderBy(
        org?.projects || [],
        [(data) => data.projectReference.key],
        ['asc'],
      )
    }
    return []
  }, [user])

  /**
   * Finds a project by ID across all organizations in the user's profile.
   * This includes inactive/deactivated projects.
   *
   * @param projectId - The ID of the project to find
   * @returns The project reference or undefined if not found
   */
  const findProjectById = (
    projectId: string,
  ): ModelsEntityReference | undefined => {
    if (!user?.organisations || !projectId) return undefined

    // Search through all organizations (not just the selected one)
    for (const org of user.organisations) {
      const project = org.projects.find(
        (p) => p.projectReference.id === projectId,
      )
      if (project) {
        return project.projectReference
      }
    }

    return undefined
  }

  return {
    findProjectById,
    userProjects: projects,
  }
}
