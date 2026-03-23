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

import { data } from 'react-router'

import { updateProject } from '~/services/api/lasius/projects/projects'
import { getTagsByProject } from '~/services/api/lasius/user-organisations/user-organisations'
import {
  authHeaders,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

/**
 * GET /api/project-tags?orgId=xxx&projectId=xxx
 *
 * Resource route loader that fetches tags for a specific project.
 * Called by the tag manager via useFetcher.load().
 */
export const loader = async ({ request }: { request: Request }) => {
  const auth = await requireUser(request)
  const headers = authHeaders(auth.session)
  const url = new URL(request.url)
  const orgId = url.searchParams.get('orgId')
  const projectId = url.searchParams.get('projectId')

  if (!orgId || !projectId) {
    return data({ tags: [] }, { headers: mergeAuthHeaders(auth), status: 400 })
  }

  const tagsRes = await getTagsByProject(orgId, projectId, { headers })

  return data({ tags: tagsRes.data }, { headers: mergeAuthHeaders(auth) })
}

/**
 * POST /api/project-tags
 *
 * Resource route action that updates project tags (bookingCategories).
 * Expects JSON body with orgId, projectId, and bookingCategories.
 */
export const action = async ({ request }: { request: Request }) => {
  const auth = await requireUser(request)
  const headers = authHeaders(auth.session)

  const body = (await request.json()) as {
    bookingCategories: unknown[]
    orgId: string
    projectId: string
  }

  const { bookingCategories, orgId, projectId } = body

  if (!orgId || !projectId) {
    return data(
      { error: 'Missing orgId or projectId' },
      { headers: mergeAuthHeaders(auth), status: 400 },
    )
  }

  await updateProject(
    orgId,
    projectId,
    { bookingCategories: bookingCategories as never[] },
    { headers },
  )

  return data({ success: true }, { headers: mergeAuthHeaders(auth) })
}
