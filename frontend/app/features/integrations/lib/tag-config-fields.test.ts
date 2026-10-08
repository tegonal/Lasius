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

import { type TagConfig } from './mapping-helpers'
import {
  applyTagFields,
  getSelectedTagFields,
  getTagConfigFilters,
  getTagFieldKeys,
} from './tag-config-fields'

const gitlab: TagConfig = {
  includeOnlyIssuesWithLabels: [],
  includeOnlyIssuesWithState: ['opened'],
  labelFilter: ['bug'],
  useLabels: true,
  useMilestone: false,
  useTitle: true,
}

const github: TagConfig = { ...gitlab, useAssignees: true }

describe('getTagFieldKeys', () => {
  it('offers assignees only for GitHub', () => {
    expect(getTagFieldKeys('gitlab')).toEqual(['useTitle', 'useLabels', 'useMilestone'])
    expect(getTagFieldKeys('github')).toEqual([
      'useTitle',
      'useLabels',
      'useMilestone',
      'useAssignees',
    ])
  })
})

describe('getSelectedTagFields', () => {
  it('lists the enabled fields in option order', () => {
    expect(getSelectedTagFields(gitlab, 'gitlab')).toEqual(['useTitle', 'useLabels'])
    expect(getSelectedTagFields(github, 'github')).toEqual([
      'useTitle',
      'useLabels',
      'useAssignees',
    ])
  })

  it('ignores assignees outside GitHub', () => {
    expect(getSelectedTagFields(github, 'plane')).toEqual(['useTitle', 'useLabels'])
  })
})

describe('applyTagFields', () => {
  it('rejects an empty selection', () => {
    expect(applyTagFields(gitlab, [], 'gitlab')).toBeNull()
  })

  it('sets every field flag from the selection and keeps the filters', () => {
    expect(applyTagFields(gitlab, ['useMilestone'], 'gitlab')).toEqual({
      ...gitlab,
      useLabels: false,
      useMilestone: true,
      useTitle: false,
    })
  })

  it('sets assignees only for GitHub', () => {
    expect(applyTagFields(github, ['useTitle'], 'github')).toMatchObject({ useAssignees: false })
    expect(applyTagFields(gitlab, ['useTitle', 'useAssignees'], 'gitlab')).not.toHaveProperty(
      'useAssignees',
    )
  })
})

describe('getTagConfigFilters', () => {
  it('gives the values of each filter', () => {
    expect(getTagConfigFilters(gitlab, ['useTitle', 'useLabels'])).toEqual({
      issueLabels: [],
      issueStates: ['opened'],
      labelFilter: ['bug'],
    })
  })

  it('hides the label filter while labels do not become tags', () => {
    expect(getTagConfigFilters(gitlab, ['useTitle']).labelFilter).toBeNull()
  })

  it('hides a filter that the config does not have, and fills a missing value', () => {
    const partial = { labelFilter: undefined, useLabels: true } as unknown as TagConfig
    expect(getTagConfigFilters(partial, ['useLabels'])).toEqual({
      issueLabels: null,
      issueStates: null,
      labelFilter: [],
    })
  })
})
