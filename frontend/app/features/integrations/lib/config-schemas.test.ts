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

import { type TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'

import { createConfigSchema } from './config-schemas'

const t = ((_key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue ?? _key) as unknown as TFunction<'common' | 'integrations'>

const base = {
  baseUrl: 'https://example.com',
  checkFrequency: 600_000,
  name: 'Main',
}

const validByType = {
  github: { ...base, accessToken: 'token', resourceOwner: 'tegonal', resourceOwnerType: 'Org' },
  gitlab: { ...base, accessToken: 'token' },
  jira: { ...base, accessToken: 'token', consumerKey: 'consumer', privateKey: 'key' },
  plane: { ...base, apiKey: 'key', workspace: 'ws' },
} as const

const credentialByType = {
  github: 'accessToken',
  gitlab: 'accessToken',
  jira: 'accessToken',
  plane: 'apiKey',
} as const

const issuePaths = (result: { error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.error?.issues.map((issue) => issue.path.join('.')) ?? []

const types = ['github', 'gitlab', 'jira', 'plane'] as const

describe('createConfigSchema', () => {
  it.each(types)('accepts a valid %s config', (type) => {
    expect(createConfigSchema(t, type).safeParse(validByType[type]).success).toBe(true)
  })

  it.each(types)('requires the credential of %s on create', (type) => {
    const { [credentialByType[type]]: _omitted, ...rest } = validByType[type] as Record<
      string,
      unknown
    >
    const result = createConfigSchema(t, type).safeParse(rest)
    expect(issuePaths(result)).toEqual([credentialByType[type]])
  })

  it.each(types)('makes the credential of %s optional on edit', (type) => {
    const { [credentialByType[type]]: _omitted, ...rest } = validByType[type] as Record<
      string,
      unknown
    >
    expect(createConfigSchema(t, type, true).safeParse(rest).success).toBe(true)
  })

  it('makes the Jira private key optional on edit only', () => {
    const { privateKey: _omitted, ...rest } = validByType.jira
    expect(issuePaths(createConfigSchema(t, 'jira').safeParse(rest))).toEqual(['privateKey'])
    expect(createConfigSchema(t, 'jira', true).safeParse(rest).success).toBe(true)
  })

  it('requires the Jira consumer key on create and on edit', () => {
    const { consumerKey: _omitted, ...rest } = validByType.jira
    expect(issuePaths(createConfigSchema(t, 'jira').safeParse(rest))).toEqual(['consumerKey'])
    expect(issuePaths(createConfigSchema(t, 'jira', true).safeParse(rest))).toEqual(['consumerKey'])
  })

  it('requires the GitHub resource owner and the Plane workspace', () => {
    const { resourceOwner: _owner, ...github } = validByType.github
    const { workspace: _workspace, ...plane } = validByType.plane
    expect(issuePaths(createConfigSchema(t, 'github').safeParse(github))).toEqual(['resourceOwner'])
    expect(issuePaths(createConfigSchema(t, 'plane').safeParse(plane))).toEqual(['workspace'])
  })

  it('rejects a check frequency below one minute with the translated message', () => {
    const result = createConfigSchema(t, 'gitlab').safeParse({
      ...validByType.gitlab,
      checkFrequency: 1000,
    })
    expect(result.error?.issues[0]?.message).toBe('Minimum 1 minute')
  })
})
