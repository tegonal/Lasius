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

import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, getApiErrorReason, lasiusFetch, toApiError } from './lasius-fetch-instance'

async function fetchError(response: Response): Promise<ApiError> {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
  try {
    await lasiusFetch('/user/register', { method: 'POST' })
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }
  throw new Error('lasiusFetch did not throw')
}

describe('lasiusFetch error body', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps a plain-text body', async () => {
    const error = await fetchError(new Response('user_already_registered', { status: 400 }))
    expect(error.status).toBe(400)
    expect(error.body).toBe('user_already_registered')
  })

  it('parses a JSON body', async () => {
    const error = await fetchError(new Response('{"message":"invalid"}', { status: 422 }))
    expect(error.body).toEqual({ message: 'invalid' })
  })

  it('returns null for an empty body', async () => {
    const error = await fetchError(new Response(null, { status: 404 }))
    expect(error.body).toBeNull()
  })
})

describe('lasiusFetch 403', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function rejection(response: Response): Promise<unknown> {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
    try {
      await lasiusFetch('/organisations/org/projects', { method: 'GET' })
    } catch (error) {
      return error
    }
    throw new Error('lasiusFetch did not throw')
  }

  it('throws a 403 Response with the reason, so the root ErrorBoundary sees the status', async () => {
    const thrown = await rejection(
      new Response('not_org_admin', { status: 403, statusText: 'Forbidden' }),
    )
    if (!(thrown instanceof Response)) throw new Error('expected a Response')
    expect(thrown.status).toBe(403)
    expect(await thrown.text()).toBe('not_org_admin')
  })

  it('hides an HTML body behind the status text', async () => {
    const thrown = await rejection(
      new Response('<html>denied</html>', { status: 403, statusText: 'Forbidden' }),
    )
    if (!(thrown instanceof Response)) throw new Error('expected a Response')
    expect(await thrown.text()).toBe('Forbidden')
  })

  it('converts the 403 Response back to an ApiError', async () => {
    const thrown = await rejection(
      new Response('not_org_admin', { status: 403, statusText: 'Forbidden' }),
    )
    const error = await toApiError(thrown)
    expect(error).toBeInstanceOf(ApiError)
    expect(error?.status).toBe(403)
    expect(error?.body).toBe('not_org_admin')
  })

  it('keeps an ApiError for any other status', async () => {
    const thrown = await rejection(new Response('missing', { status: 404 }))
    expect(thrown).toBeInstanceOf(ApiError)
    expect(await toApiError(thrown)).toBe(thrown)
  })

  it('returns undefined for a value that is not an API error', async () => {
    expect(await toApiError(new TypeError('fetch failed'))).toBeUndefined()
  })
})

describe('getApiErrorReason', () => {
  it('returns a plain-text reason of a 4xx response', () => {
    const error = new ApiError(400, 'Bad Request', 'Connection refused by Jira')
    expect(getApiErrorReason(error)).toBe('Connection refused by Jira')
  })

  it('returns the status text for a 5xx response', () => {
    expect(getApiErrorReason(new ApiError(500, 'Internal Server Error', 'trace'))).toBe(
      'Internal Server Error',
    )
  })

  it('returns the status text for an HTML page', () => {
    const error = new ApiError(404, 'Not Found', '<!DOCTYPE html><html></html>')
    expect(getApiErrorReason(error)).toBe('Not Found')
  })

  it('returns the status text for a JSON or empty body', () => {
    expect(getApiErrorReason(new ApiError(400, 'Bad Request', { message: 'x' }))).toBe(
      'Bad Request',
    )
    expect(getApiErrorReason(new ApiError(400, 'Bad Request', null))).toBe('Bad Request')
  })
})
