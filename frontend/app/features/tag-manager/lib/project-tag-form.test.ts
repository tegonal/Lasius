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

import {
  resolveProjectReferences,
  sortTagGroupsById,
  splitBookingCategories,
} from '~/features/tag-manager/lib/project-tag-form'
import { type ModelsProject } from '~/services/api/lasius/modelsProject'
import { type ModelsTag } from '~/services/api/lasius/modelsTag'
import { type ModelsTagGroup } from '~/services/api/lasius/modelsTagGroup'
import { type ModelsUserProject } from '~/services/api/lasius/modelsUserProject'

// The API types carry more fields than the helpers read, so the fixtures cast a partial shape.
const fixture = <T>(value: object) => value as T
const group = (id: string) => fixture<ModelsTagGroup>({ id, relatedTags: [], type: 'TagGroup' })
const simple = (id: string) => fixture<ModelsTag>({ id, type: 'SimpleTag' })

describe('splitBookingCategories', () => {
  it('separates tag groups from simple tags and drops other tag types', () => {
    const result = splitBookingCategories([
      group('g1'),
      simple('s1'),
      fixture<ModelsTag>({ id: 'i1', type: 'GitlabIssueTag' }),
      group('g2'),
    ])
    expect(result.groups.map((g) => g.id)).toEqual(['g1', 'g2'])
    expect(result.simple.map((s) => s.id)).toEqual(['s1'])
  })
})

describe('resolveProjectReferences', () => {
  it('reads a user project and uses the selected organisation', () => {
    const item = fixture<ModelsUserProject>({ projectReference: { id: 'p1', key: 'Lasius' } })
    expect(resolveProjectReferences(item, 'org-selected')).toEqual({
      organisationId: 'org-selected',
      projectId: 'p1',
      projectKey: 'Lasius',
    })
  })

  it('reads a project with its own organisation', () => {
    const item = fixture<ModelsProject>({
      id: 'p2',
      key: 'Marketing',
      organisationReference: { id: 'org-own', key: 'Own' },
    })
    expect(resolveProjectReferences(item, 'org-selected')).toEqual({
      organisationId: 'org-own',
      projectId: 'p2',
      projectKey: 'Marketing',
    })
  })
})

describe('sortTagGroupsById', () => {
  it('sorts by id and keeps the input order unchanged', () => {
    const groups = [group('b'), group('a')]
    expect(sortTagGroupsById(groups).map((g) => g.id)).toEqual(['a', 'b'])
    expect(groups.map((g) => g.id)).toEqual(['b', 'a'])
  })
})
