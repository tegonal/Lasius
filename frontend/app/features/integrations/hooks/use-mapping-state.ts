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

import { useCallback, useState } from 'react'

import {
  type MappingsByExternalProject,
  type TagConfig,
} from '~/features/integrations/lib/mapping-helpers'

export const useMappingState = (initialMappings: MappingsByExternalProject = {}) => {
  const [mappings, setMappings] = useState<MappingsByExternalProject>(initialMappings)

  const upsertMapping = useCallback(
    (externalProjectId: string, lasiusProjectId: string, tagConfig: TagConfig | undefined) => {
      setMappings((previous) => {
        const array = previous[externalProjectId] ?? []
        const filtered = array.filter((m) => m.projectId !== lasiusProjectId)
        return {
          ...previous,
          [externalProjectId]: [...filtered, { projectId: lasiusProjectId, tagConfig }],
        }
      })
    },
    [],
  )

  const removeMapping = useCallback((externalProjectId: string, lasiusProjectId: string) => {
    setMappings((previous) => {
      const array = (previous[externalProjectId] ?? []).filter(
        (m) => m.projectId !== lasiusProjectId,
      )
      if (array.length === 0) {
        const { [externalProjectId]: _, ...rest } = previous
        return rest
      }
      return { ...previous, [externalProjectId]: array }
    })
  }, [])

  return { mappings, removeMapping, setMappings, upsertMapping }
}
