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

import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius'

import {
  buildConfigUpdateBody,
  DEFAULT_CHECK_FREQUENCY_MS,
  getEditConfigDefaults,
  getImporterTypeOfConfig,
} from './config-defaults'

const configOf = (fields: Record<string, unknown>) =>
  ({
    baseUrl: 'https://gitlab.example.com',
    checkFrequency: 600_000,
    id: 'config-1',
    importerType: 'gitlab',
    name: 'GitLab main',
    ...fields,
  }) as unknown as ModelsIssueImporterConfigResponse

const formValue = {
  baseUrl: 'https://gitlab.example.com',
  checkFrequency: 600_000,
  name: 'GitLab main',
}

describe('getImporterTypeOfConfig', () => {
  it('returns the importer type of the config', () => {
    expect(getImporterTypeOfConfig(configOf({ importerType: 'jira' }))).toBe('jira')
  })

  it('strips a Config suffix and the case', () => {
    expect(getImporterTypeOfConfig(configOf({ importerType: 'PlaneConfig' }))).toBe('plane')
  })

  it('falls back to gitlab for an unknown type', () => {
    expect(getImporterTypeOfConfig(configOf({ importerType: 'redmine' }))).toBe('gitlab')
  })
})

describe('getEditConfigDefaults', () => {
  it('takes the stored values and leaves the credentials empty', () => {
    expect(getEditConfigDefaults(configOf({ importerType: 'plane', workspace: 'lasius' }))).toEqual(
      {
        accessToken: '',
        apiKey: '',
        baseUrl: 'https://gitlab.example.com',
        checkFrequency: '600000',
        consumerKey: '',
        name: 'GitLab main',
        privateKey: '',
        resourceOwner: '',
        resourceOwnerType: '',
        workspace: 'lasius',
      },
    )
  })

  it('uses the default interval without a config', () => {
    expect(getEditConfigDefaults(null).checkFrequency).toBe(String(DEFAULT_CHECK_FREQUENCY_MS))
  })
})

describe('buildConfigUpdateBody', () => {
  it('omits empty credentials and sends the cleared config fields as null', () => {
    expect(buildConfigUpdateBody({ ...formValue, accessToken: '', workspace: '' })).toEqual({
      ...formValue,
      resourceOwner: null,
      workspace: null,
    })
  })

  it('sends a new credential and the resource owner', () => {
    expect(
      buildConfigUpdateBody({
        ...formValue,
        accessToken: 'new-token',
        resourceOwner: 'tegonal',
        resourceOwnerType: 'Organization',
      }),
    ).toEqual({
      ...formValue,
      accessToken: 'new-token',
      resourceOwner: 'tegonal',
      resourceOwnerType: 'Organization',
      workspace: null,
    })
  })
})
