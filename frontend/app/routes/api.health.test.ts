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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getConfiguration } from '~/services/api/lasius/general/general'
import { getAuthSecret } from '~/services/auth/auth-secret.server'

import { loader } from './api.health'

vi.mock('~/services/api/lasius/general/general', () => ({
  getConfiguration: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
}))
vi.mock('~/services/auth/auth-secret.server', () => ({ getAuthSecret: vi.fn(() => 'secret') }))

describe('api.health loader', () => {
  beforeEach(() => {
    vi.stubEnv('LASIUS_VERSION', '3.0.0')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('answers 200 with a reachable backend and a session secret', async () => {
    const result = await loader()

    expect(result.data).toEqual({ backend: 'connected', status: 'ok', version: '3.0.0' })
    expect(result.init?.status).toBe(200)
    expect(new Headers(result.init?.headers).get('Cache-Control')).toBe('no-store')
  })

  it('probes the backend with an abort signal', async () => {
    await loader()

    const [options] = vi.mocked(getConfiguration).mock.calls[0] ?? []
    expect(options?.signal).toBeInstanceOf(AbortSignal)
  })

  it('reports a disconnected backend when the probe throws', async () => {
    vi.mocked(getConfiguration).mockRejectedValueOnce(new DOMException('timeout', 'TimeoutError'))

    const result = await loader()

    expect(result.data.backend).toBe('disconnected')
    expect(result.init?.status).toBe(200)
  })

  it('answers 503 without a session secret', async () => {
    vi.mocked(getAuthSecret).mockReturnValueOnce(undefined)

    const result = await loader()

    expect(result.data.status).toBe('error')
    expect(result.init?.status).toBe(503)
  })
})
