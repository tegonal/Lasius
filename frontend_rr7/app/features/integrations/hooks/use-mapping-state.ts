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
  type TagConfiguration,
} from '~/features/integrations/lib/mapping-helpers'

export const useMappingState = (
  initialMappings: MappingsByExternalProject = {},
) => {
  const [mappings, setMappings] =
    useState<MappingsByExternalProject>(initialMappings)

  const upsertMapping = useCallback(
    (
      externalProjectId: string,
      lasiusProjectId: string,
      tagConfig: TagConfiguration | undefined,
    ) => {
      setMappings((prev) => {
        const arr = prev[externalProjectId] ?? []
        const filtered = arr.filter((m) => m.projectId !== lasiusProjectId)
        return {
          ...prev,
          [externalProjectId]: [
            ...filtered,
            { projectId: lasiusProjectId, tagConfig },
          ],
        }
      })
    },
    [],
  )

  const removeMapping = useCallback(
    (externalProjectId: string, lasiusProjectId: string) => {
      setMappings((prev) => {
        const arr = (prev[externalProjectId] ?? []).filter(
          (m) => m.projectId !== lasiusProjectId,
        )
        if (arr.length === 0) {
          const { [externalProjectId]: _, ...rest } = prev
          return rest
        }
        return { ...prev, [externalProjectId]: arr }
      })
    },
    [],
  )

  return { mappings, removeMapping, setMappings, upsertMapping }
}
