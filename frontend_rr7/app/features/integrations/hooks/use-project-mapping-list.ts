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

import { useMemo } from 'react'

import { type MappingWithTagConfig } from '~/features/integrations/lib/mapping-helpers'
import { type ModelsExternalProject } from '~/services/api/lasius'

type UseProjectMappingListOptions = {
  filterText: string
  mappings: Record<string, MappingWithTagConfig>
  projects: ModelsExternalProject[]
}

export const useProjectMappingList = ({
  filterText,
  mappings,
  projects,
}: UseProjectMappingListOptions) => {
  const filteredProjects = useMemo(() => {
    if (!filterText.trim()) return projects

    const searchLower = filterText.toLowerCase()
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchLower) ||
        project.id.toLowerCase().includes(searchLower),
    )
  }, [projects, filterText])

  const orphanedMappings = useMemo(() => {
    const externalProjectIds = new Set(projects.map((p) => p.id))
    const orphaned: Array<{
      externalId: string
      mapping: MappingWithTagConfig
    }> = []

    for (const [externalId, mapping] of Object.entries(mappings)) {
      if (!externalProjectIds.has(externalId)) {
        orphaned.push({ externalId, mapping })
      }
    }

    return orphaned
  }, [projects, mappings])

  const sortedProjects = useMemo(() => {
    return [...filteredProjects].toSorted((a, b) => {
      const aMapped = !!mappings[a.id]
      const bMapped = !!mappings[b.id]

      if (aMapped && !bMapped) return -1
      if (!aMapped && bMapped) return 1
      return 0
    })
  }, [filteredProjects, mappings])

  const mappedCount = Object.keys(mappings).length
  const showFilter = projects.length > 10

  return {
    filteredProjects,
    mappedCount,
    orphanedMappings,
    showFilter,
    sortedProjects,
  }
}
