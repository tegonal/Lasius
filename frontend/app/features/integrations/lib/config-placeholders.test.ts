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

import { getConfigBaseUrlPlaceholder, getConfigNamePlaceholder } from './config-placeholders'

const t = (key: string, options: string | { defaultValue: string }) =>
  `${key}|${typeof options === 'string' ? options : options.defaultValue}`

describe('config placeholders', () => {
  it('uses one static key per importer type for the name', () => {
    expect(getConfigNamePlaceholder('github', t)).toBe(
      'integrations:issueImporters.fields.namePlaceholder.github|e.g., Company GitHub',
    )
    expect(getConfigNamePlaceholder('plane', t)).toBe(
      'integrations:issueImporters.fields.namePlaceholder.plane|e.g., Company Plane',
    )
  })

  it('uses one static key per importer type for the base URL', () => {
    expect(getConfigBaseUrlPlaceholder('jira', t)).toBe(
      'integrations:issueImporters.fields.baseUrlPlaceholder.jira|https://company.atlassian.net',
    )
    expect(getConfigBaseUrlPlaceholder('gitlab', t)).toBe(
      'integrations:issueImporters.fields.baseUrlPlaceholder.gitlab|https://...',
    )
  })
})
