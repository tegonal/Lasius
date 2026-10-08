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

import { buildConnectivityBody, hasNewCredentials } from './connection-test'

describe('hasNewCredentials', () => {
  it('checks the access token for GitHub and GitLab', () => {
    expect(hasNewCredentials('github', { accessToken: 'token' })).toBe(true)
    expect(hasNewCredentials('gitlab', { accessToken: '' })).toBe(false)
    expect(hasNewCredentials('gitlab', { apiKey: 'key' })).toBe(false)
  })

  it('accepts any of the three Jira credentials', () => {
    expect(hasNewCredentials('jira', { accessToken: 'token' })).toBe(true)
    expect(hasNewCredentials('jira', { consumerKey: 'key' })).toBe(true)
    expect(hasNewCredentials('jira', { privateKey: 'pem' })).toBe(true)
    expect(hasNewCredentials('jira', {})).toBe(false)
  })

  it('checks the API key for Plane', () => {
    expect(hasNewCredentials('plane', { apiKey: 'key' })).toBe(true)
    expect(hasNewCredentials('plane', { accessToken: 'token' })).toBe(false)
  })
})

describe('buildConnectivityBody', () => {
  it('converts the check frequency and leaves out empty optional fields', () => {
    const body = buildConnectivityBody('gitlab', {
      accessToken: 'token',
      apiKey: '',
      baseUrl: 'http://localhost:8999',
      checkFrequency: '300000',
      name: 'Stub',
      workspace: '',
    })
    // toEqual ignores the keys with an undefined value, as JSON.stringify does in the request.
    expect(body).toEqual({
      accessToken: 'token',
      baseUrl: 'http://localhost:8999',
      checkFrequency: 300_000,
      importerType: 'gitlab',
      name: 'Stub',
    })
  })

  it('keeps the Jira and Plane fields', () => {
    expect(
      buildConnectivityBody('jira', { consumerKey: 'ck', privateKey: 'pem', resourceOwner: 'o' }),
    ).toMatchObject({ consumerKey: 'ck', privateKey: 'pem', resourceOwner: 'o' })
    expect(buildConnectivityBody('plane', { apiKey: 'key', workspace: 'ws' })).toMatchObject({
      apiKey: 'key',
      workspace: 'ws',
    })
  })
})
