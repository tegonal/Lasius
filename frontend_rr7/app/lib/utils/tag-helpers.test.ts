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

import { getImporterTypeFromTag, isImporterTag } from './tag-helpers'

const makeTag = (type: string) => ({ id: 't1', type }) as any

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
  it.each([
    'GithubIssueTag',
    'GitlabIssueTag',
    'JiraIssueTag',
    'PlaneIssueTag',
  ])('returns true for %s', (type) => {
    expect(isImporterTag(makeTag(type))).toBe(true)
  })

  it.each(['SimpleTag', 'TagGroup'])('returns false for %s', (type) => {
    expect(isImporterTag(makeTag(type))).toBe(false)
  })
})
