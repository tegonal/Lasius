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

/**
 * Custom fetch mutator for Orval-generated API client.
 *
 * Orval's fetch client generates calls as:
 *   lasiusFetch<T>(url: string, init: RequestInit): Promise<T>
 *
 * The URL from Orval is a relative path matching the backend route (e.g. `/organisations/:orgId/projects`).
 * This mutator prepends the backend base URL (which includes the Play context path `/backend`)
 * and handles response parsing.
 *
 * Usage in loaders/actions:
 *   const result = await getProjects(orgId, {
 *     headers: { Authorization: `Bearer ${token}` },
 *   })
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown,
  ) {
    super(`API error: ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

/**
 * Resolve the Lasius backend base URL.
 *
 * On the server side (loaders/actions), LASIUS_API_URL_INTERNAL allows
 * container-to-container networking (e.g. http://backend:9000).
 * Falls back to the public LASIUS_API_URL.
 */
function getBaseUrl(): string {
  if (import.meta.env.SSR) {
    // Env vars already include the Play context path (/backend)
    return (
      process.env.LASIUS_API_URL_INTERNAL ||
      process.env.LASIUS_API_URL ||
      'http://localhost:9000/backend'
    )
  }
  return ''
}

export const lasiusFetch = async <T>(
  url: string,
  init: RequestInit,
): Promise<T> => {
  const baseUrl = getBaseUrl()
  const fullUrl = `${baseUrl}${url}`

  const response = await fetch(fullUrl, init)

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = await response.text().catch(() => null)
    }
    throw new ApiError(response.status, response.statusText, body)
  }

  // Handle empty responses (204 No Content, etc.)
  if (
    response.status === 204 ||
    response.headers.get('content-length') === '0'
  ) {
    return undefined as T
  }

  const data = await response.json()
  const result = Object.assign(Object.create(null), {
    data,
    headers: response.headers,
    status: response.status,
  })
  return result as T
}

export type BodyType<BodyData> = BodyData
export type ErrorType<Error> = ApiError & { data?: Error }
