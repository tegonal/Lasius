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

import { type WizardFormData } from '~/features/integrations/hooks/use-wizard-state'

import { buildConfigBody } from './wizard-config-body'

const formData: WizardFormData = {
  accessToken: 'token',
  apiKey: 'api-key',
  baseUrl: 'https://example.com',
  checkFrequency: 600_000,
  consumerKey: 'consumer',
  name: 'Main',
  privateKey: 'private',
  resourceOwner: 'tegonal',
  resourceOwnerType: 'Organization',
  workspace: 'ws',
}

const common = {
  accessToken: 'token',
  baseUrl: 'https://example.com',
  checkFrequency: 600_000,
  name: 'Main',
}

describe('buildConfigBody', () => {
  it('adds only the common fields for GitLab', () => {
    expect(buildConfigBody({ ...formData, importerType: 'gitlab' })).toEqual({
      ...common,
      importerType: 'gitlab',
    })
  })

  it('adds the resource owner for GitHub', () => {
    expect(buildConfigBody({ ...formData, importerType: 'github' })).toEqual({
      ...common,
      importerType: 'github',
      resourceOwner: 'tegonal',
      resourceOwnerType: 'Organization',
    })
  })

  it('adds the consumer key and the private key for Jira', () => {
    expect(buildConfigBody({ ...formData, importerType: 'jira' })).toEqual({
      ...common,
      consumerKey: 'consumer',
      importerType: 'jira',
      privateKey: 'private',
    })
  })

  it('adds the API key and the workspace for Plane', () => {
    expect(buildConfigBody({ ...formData, importerType: 'plane' })).toEqual({
      ...common,
      apiKey: 'api-key',
      importerType: 'plane',
      workspace: 'ws',
    })
  })
})
