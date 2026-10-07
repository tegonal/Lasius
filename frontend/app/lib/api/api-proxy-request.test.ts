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

import { describe, expect, it } from 'vitest'

import { buildProxyPayload, readProxyEnvelope } from './api-proxy-request'

const config = {
  getUrl: ({ orgId }: { orgId: string }) => `/organisations/${orgId}`,
  method: 'PUT',
}

describe('buildProxyPayload', () => {
  it('builds the URL from the path parameters and keeps the body', () => {
    expect(buildProxyPayload(config, { body: { key: 'acme' }, orgId: 'o1' })).toEqual({
      body: { key: 'acme' },
      method: 'PUT',
      url: '/organisations/o1',
    })
  })

  it('does not pass the body or skipAuth to getUrl', () => {
    const seen: unknown[] = []
    const spyConfig = {
      getUrl: (parameters: unknown) => {
        seen.push(parameters)
        return '/x'
      },
      method: 'POST',
    }
    buildProxyPayload(spyConfig, { body: { a: 1 }, id: 'b1', skipAuth: true })
    expect(seen).toEqual([{ id: 'b1' }])
  })

  it('omits the body and skipAuth when the call has no arguments', () => {
    expect(buildProxyPayload({ getUrl: () => '/me', method: 'GET' }, undefined)).toEqual({
      method: 'GET',
      url: '/me',
    })
  })

  it('takes skipAuth from the config', () => {
    expect(buildProxyPayload({ ...config, skipAuth: true }, { orgId: 'o1' }).skipAuth).toBe(true)
  })

  it('lets the call argument override skipAuth of the config', () => {
    expect(
      buildProxyPayload({ ...config, skipAuth: true }, { orgId: 'o1', skipAuth: false }),
    ).not.toHaveProperty('skipAuth')
    expect(buildProxyPayload(config, { orgId: 'o1', skipAuth: true }).skipAuth).toBe(true)
  })

  it('keeps a null body', () => {
    expect(buildProxyPayload(config, { body: null, orgId: 'o1' })).toHaveProperty('body', null)
  })
})

describe('readProxyEnvelope', () => {
  it('reports nothing before a request', () => {
    expect(readProxyEnvelope(undefined)).toEqual({
      data: undefined,
      error: undefined,
      isError: false,
      isSubmitted: false,
      isSuccess: false,
    })
  })

  it('returns the data of a success envelope', () => {
    expect(readProxyEnvelope({ data: { id: 1 }, ok: true })).toEqual({
      data: { id: 1 },
      error: undefined,
      isError: false,
      isSubmitted: true,
      isSuccess: true,
    })
  })

  it('returns the error and the status of an error envelope', () => {
    expect(readProxyEnvelope({ error: 'Forbidden', ok: false, status: 403 })).toEqual({
      data: undefined,
      error: { error: 'Forbidden', status: 403 },
      isError: true,
      isSubmitted: true,
      isSuccess: false,
    })
  })
})
