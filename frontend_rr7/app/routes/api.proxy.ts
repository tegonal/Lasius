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

import { ApiError, lasiusFetch } from '~/services/api/lasius-fetch-instance'
import {
  authHeadersWithCsrf,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/api.proxy'

export type ProxyEnvelope<T = unknown> =
  | { data: T; ok: true }
  | { error: string; ok: false; status: number }

/**
 * POST /api/proxy
 *
 * Generic API proxy route. Receives JSON payload with:
 *   - url: backend API path (must start with /)
 *   - method: HTTP method
 *   - body?: request body (forwarded as JSON)
 *   - skipAuth?: boolean (skip auth header injection)
 *
 * Injects auth headers (JWT + CSRF) unless skipAuth is true.
 * Forwards the request to the backend via lasiusFetch.
 *
 * Returns a consistent envelope: { ok: true, data } or { ok: false, error, status }
 */
export async function action({ request }: Route.ActionArgs) {
  const json = (await request.json()) as {
    body?: unknown
    method: string
    skipAuth?: boolean
    url: string
  }

  const { body, method, skipAuth, url } = json

  if (!url || !method) {
    return data(
      {
        error: 'Missing url or method',
        ok: false,
        status: 400,
      } satisfies ProxyEnvelope,
      { status: 400 },
    )
  }

  // Prevent SSRF — only allow relative paths
  if (!url.startsWith('/')) {
    return data(
      {
        error: 'URL must be a relative path',
        ok: false,
        status: 400,
      } satisfies ProxyEnvelope,
      { status: 400 },
    )
  }

  let headers: Record<string, string> = {}
  let authResult

  if (!skipAuth) {
    authResult = await requireUser(request)
    headers = await authHeadersWithCsrf(authResult.session)
  }

  try {
    const result = await lasiusFetch<{ data?: unknown }>(url, {
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...headers,
      },
      method,
      ...(body !== undefined && { body: JSON.stringify(body) }),
    })

    const envelope: ProxyEnvelope = { data: result?.data ?? null, ok: true }

    return data(envelope, {
      headers: authResult ? mergeAuthHeaders(authResult) : {},
    })
  } catch (e) {
    if (e instanceof ApiError) {
      const envelope: ProxyEnvelope = {
        error: e.statusText,
        ok: false,
        status: e.status,
      }
      return data(envelope, {
        headers: authResult ? mergeAuthHeaders(authResult) : {},
        status: e.status,
      })
    }
    return data(
      {
        error: 'Internal proxy error',
        ok: false,
        status: 500,
      } satisfies ProxyEnvelope,
      { status: 500 },
    )
  }
}
