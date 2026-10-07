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
  buildInitialMappings,
  buildMappingPayload,
  extractExternalProjectId,
  type ProjectMapping,
  type TagConfig,
} from './mapping-helpers'

const tagConfig: TagConfig = {
  includeOnlyIssuesWithLabels: [],
  includeOnlyIssuesWithState: [],
  labelFilter: [],
  useLabels: true,
  useMilestone: false,
  useTitle: false,
}

const mappingOf = (settings: Record<string, unknown> | undefined) =>
  ({ id: 'mapping-1', projectId: 'lasius-1', settings }) as unknown as ProjectMapping

const payloadOf = (result: ReturnType<typeof buildMappingPayload>) => {
  if (!result.success) throw new Error(`expected success, got ${result.error}`)
  return result.payload
}

describe('buildMappingPayload', () => {
  it('splits a GitHub id into owner and repo', () => {
    const payload = payloadOf(buildMappingPayload('github', 'tegonal/lasius', 'lasius-1'))
    expect(payload.githubRepoOwner).toBe('tegonal')
    expect(payload.githubRepoName).toBe('lasius')
    expect(payload.projectId).toBe('lasius-1')
    expect(payload.gitlabProjectId).toBeNull()
  })

  it('sets the GitHub tag config when given', () => {
    const payload = payloadOf(buildMappingPayload('github', 'a/b', 'p', tagConfig))
    expect(payload.githubTagConfig).toEqual(tagConfig)
  })

  it('rejects a GitHub id without a slash', () => {
    expect(buildMappingPayload('github', 'lasius', 'p')).toEqual({
      error: 'Invalid GitHub repository format. Expected "owner/repo"',
      success: false,
    })
  })

  it('rejects a GitHub id with an empty owner or repo', () => {
    expect(buildMappingPayload('github', '/lasius', 'p').success).toBe(false)
    expect(buildMappingPayload('github', 'tegonal/', 'p').success).toBe(false)
  })

  it('rejects a GitHub id with more than one slash', () => {
    expect(buildMappingPayload('github', 'a/b/c', 'p')).toEqual({
      error: 'Invalid GitHub repository format. Expected "owner/repo"',
      success: false,
    })
  })

  it('sets the GitLab project id and the tag config', () => {
    const payload = payloadOf(buildMappingPayload('gitlab', '42', 'p', tagConfig))
    expect(payload.gitlabProjectId).toBe('42')
    expect(payload.gitlabTagConfig).toEqual(tagConfig)
  })

  it('omits the GitLab tag config when none is given', () => {
    const payload = payloadOf(buildMappingPayload('gitlab', '42', 'p'))
    expect(payload.gitlabTagConfig).toBeUndefined()
  })

  it('sets the Plane project id and the tag config', () => {
    const payload = payloadOf(buildMappingPayload('plane', 'plane-1', 'p', tagConfig))
    expect(payload.planeProjectId).toBe('plane-1')
    expect(payload.planeTagConfig).toEqual(tagConfig)
  })

  it('omits the Plane tag config when none is given', () => {
    const payload = payloadOf(buildMappingPayload('plane', 'plane-1', 'p'))
    expect(payload.planeTagConfig).toBeUndefined()
  })

  it('sets the Jira project key and ignores the tag config', () => {
    const payload = payloadOf(buildMappingPayload('jira', 'LAS', 'p', tagConfig))
    expect(payload.jiraProjectKey).toBe('LAS')
    expect(payload.githubTagConfig).toBeUndefined()
    expect(payload.gitlabTagConfig).toBeUndefined()
    expect(payload.planeTagConfig).toBeUndefined()
  })

  it('keeps the external project name', () => {
    const payload = payloadOf(buildMappingPayload('jira', 'LAS', 'p', undefined, 'Lasius'))
    expect(payload.externalProjectName).toBe('Lasius')
  })

  it('stores an empty external project name as null', () => {
    const payload = payloadOf(buildMappingPayload('jira', 'LAS', 'p', undefined, ''))
    expect(payload.externalProjectName).toBeNull()
  })

  it.each(['gitlab', 'jira', 'plane'] as const)('rejects an empty or blank id for %s', (type) => {
    expect(buildMappingPayload(type, '', 'p')).toEqual({
      error: 'Missing external project id',
      success: false,
    })
    expect(buildMappingPayload(type, '  ', 'p').success).toBe(false)
  })
})

describe('buildInitialMappings', () => {
  const gitlabMapping = (id: string, projectId: string, gitlabProjectId: string) =>
    ({
      id,
      projectId,
      settings: { gitlabProjectId, tagConfiguration: tagConfig },
    }) as unknown as ProjectMapping

  it('groups several Lasius projects under one external project', () => {
    const result = buildInitialMappings('gitlab', [
      gitlabMapping('m1', 'lasius-1', '42'),
      gitlabMapping('m2', 'lasius-2', '42'),
      gitlabMapping('m3', 'lasius-3', '7'),
    ])
    expect(result).toEqual({
      '7': [{ id: 'm3', projectId: 'lasius-3', tagConfig }],
      '42': [
        { id: 'm1', projectId: 'lasius-1', tagConfig },
        { id: 'm2', projectId: 'lasius-2', tagConfig },
      ],
    })
  })

  it('skips a mapping without an external id or without a Lasius project', () => {
    const result = buildInitialMappings('gitlab', [
      mappingOf(undefined),
      gitlabMapping('m2', '', '42'),
    ])
    expect(result).toEqual({})
  })
})

describe('extractExternalProjectId', () => {
  it('joins the GitHub owner and repo', () => {
    const mapping = mappingOf({ githubRepoName: 'lasius', githubRepoOwner: 'tegonal' })
    expect(extractExternalProjectId('github', mapping)).toBe('tegonal/lasius')
  })

  it('returns null for a GitHub owner without a repo', () => {
    expect(extractExternalProjectId('github', mappingOf({ githubRepoOwner: 'tegonal' }))).toBeNull()
  })

  it('returns the GitLab project id', () => {
    expect(extractExternalProjectId('gitlab', mappingOf({ gitlabProjectId: '42' }))).toBe('42')
  })

  it('returns the Jira project key', () => {
    expect(extractExternalProjectId('jira', mappingOf({ jiraProjectKey: 'LAS' }))).toBe('LAS')
  })

  it('returns the Plane project id', () => {
    expect(extractExternalProjectId('plane', mappingOf({ planeProjectId: 'p-1' }))).toBe('p-1')
  })

  it('returns null for an empty id', () => {
    expect(extractExternalProjectId('gitlab', mappingOf({ gitlabProjectId: '' }))).toBeNull()
  })

  it('returns null when the mapping has no settings', () => {
    expect(extractExternalProjectId('jira', mappingOf(undefined))).toBeNull()
  })
})
