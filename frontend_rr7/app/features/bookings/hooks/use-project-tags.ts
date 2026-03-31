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

import { useEffect, useRef } from 'react'

import { type ModelsTag } from '~/services/api/lasius'
import { useGetTagsByProject } from '~/services/api/lasius-hooks/user-organisations/user-organisations'

/**
 * Fetches tags for the selected project, deduplicating requests via a stable ref.
 * Triggers a new fetch only when the org+project key changes.
 */
export function useProjectTags(
  selectedOrgId: string,
  projectId: string | undefined,
) {
  const tagsApi = useGetTagsByProject()
  const tagsSubmitRef = useRef(tagsApi.submit)
  tagsSubmitRef.current = tagsApi.submit
  const prevProjectKeyRef = useRef('')

  useEffect(() => {
    const key = `${selectedOrgId}:${projectId}`
    if (selectedOrgId && projectId && key !== prevProjectKeyRef.current) {
      prevProjectKeyRef.current = key
      tagsSubmitRef.current({ orgId: selectedOrgId, projectId })
    }
  }, [selectedOrgId, projectId])

  const projectTags: ModelsTag[] = tagsApi.data ?? []

  return { projectTags, tagsApi }
}
