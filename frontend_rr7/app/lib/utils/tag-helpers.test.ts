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

import { type ModelsTag } from '~/services/api/lasius'

import { getImporterTypeFromTag, isImporterTag } from './tag-helpers'

const tagsByType = {
  GithubIssueTag: {
    id: 't1',
    issueLink: 'https://github.com/owner/repo/issues/1',
    issueNumber: 1,
    relatedTags: [],
    repoName: 'repo',
    repoOwner: 'owner',
    type: 'GithubIssueTag',
  },
  GitlabIssueTag: {
    id: 't1',
    issueLink: 'https://gitlab.com/group/project/-/issues/1',
    projectId: 1,
    relatedTags: [],
    type: 'GitlabIssueTag',
  },
  JiraIssueTag: {
    baseUrl: 'https://example.atlassian.net',
    id: 't1',
    projectKey: 'PRJ',
    type: 'JiraIssueTag',
    url: 'https://example.atlassian.net/browse/PRJ-1',
  },
  PlaneIssueTag: {
    id: 't1',
    issueLink: 'https://app.plane.so/workspace/projects/p1/issues/1',
    projectId: 'p1',
    relatedTags: [],
    type: 'PlaneIssueTag',
  },
  SimpleTag: { id: 't1', type: 'SimpleTag' },
  TagGroup: { id: 't1', relatedTags: [], type: 'TagGroup' },
} satisfies Record<string, ModelsTag>

type TagType = keyof typeof tagsByType

const makeTag = (type: TagType): ModelsTag => tagsByType[type]

describe('getImporterTypeFromTag', () => {
  it('returns "github" for GithubIssueTag', () => {
    expect(getImporterTypeFromTag(makeTag('GithubIssueTag'))).toBe('github')
  })

  it('returns "gitlab" for GitlabIssueTag', () => {
    expect(getImporterTypeFromTag(makeTag('GitlabIssueTag'))).toBe('gitlab')
  })

  it('returns "jira" for JiraIssueTag', () => {
    expect(getImporterTypeFromTag(makeTag('JiraIssueTag'))).toBe('jira')
  })

  it('returns "plane" for PlaneIssueTag', () => {
    expect(getImporterTypeFromTag(makeTag('PlaneIssueTag'))).toBe('plane')
  })

  it('returns null for unknown tag type', () => {
    expect(getImporterTypeFromTag(makeTag('SimpleTag'))).toBeNull()
  })
})

describe('isImporterTag', () => {
  it.each<TagType>(['GithubIssueTag', 'GitlabIssueTag', 'JiraIssueTag', 'PlaneIssueTag'])(
    'returns true for %s',
    (type) => {
      expect(isImporterTag(makeTag(type))).toBe(true)
    },
  )

  it.each<TagType>(['SimpleTag', 'TagGroup'])('returns false for %s', (type) => {
    expect(isImporterTag(makeTag(type))).toBe(false)
  })
})
