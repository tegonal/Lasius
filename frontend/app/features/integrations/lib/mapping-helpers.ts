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

import { type ImporterType } from '~/lib/utils/tag-helpers'
import {
  type ModelsCreateProjectMapping,
  type ModelsGithubProjectMapping,
  type ModelsGithubTagConfiguration,
  type ModelsGitlabProjectMapping,
  type ModelsGitlabTagConfiguration,
  type ModelsJiraProjectMapping,
  type ModelsPlaneProjectMapping,
  type ModelsPlaneTagConfiguration,
  type ModelsProjectMappingId,
  type ModelsProjectSyncStats,
} from '~/services/api/lasius'

export type MappingPayloadResult =
  | {
      error: string
      success: false
    }
  | {
      payload: ModelsCreateProjectMapping
      success: true
    }

export type MappingsByExternalProject = Record<string, MappingWithTagConfig[]>

export type MappingWithTagConfig = {
  id?: ModelsProjectMappingId
  projectId: string
  tagConfig?: TagConfig
}

export type ProjectMapping =
  | ModelsGithubProjectMapping
  | ModelsGitlabProjectMapping
  | ModelsJiraProjectMapping
  | ModelsPlaneProjectMapping

export type TagConfig =
  ModelsGithubTagConfiguration | ModelsGitlabTagConfiguration | ModelsPlaneTagConfiguration

type PlatformFields = Partial<ModelsCreateProjectMapping>

type PlatformFieldsResult = { error: string } | { fields: PlatformFields }

const INVALID_GITHUB_REPO = 'Invalid GitHub repository format. Expected "owner/repo"'
const MISSING_EXTERNAL_PROJECT_ID = 'Missing external project id'

const githubFields = (externalProjectId: string, tagConfig?: TagConfig): PlatformFieldsResult => {
  const parts = externalProjectId.split('/')
  const [owner, repo] = parts
  if (parts.length !== 2 || !owner || !repo) {
    return { error: INVALID_GITHUB_REPO }
  }
  return {
    fields: {
      githubRepoName: repo,
      githubRepoOwner: owner,
      githubTagConfig: tagConfig as ModelsGithubTagConfiguration | undefined,
    },
  }
}

const PLATFORM_FIELDS: Record<
  ImporterType,
  (externalProjectId: string, tagConfig?: TagConfig) => PlatformFieldsResult
> = {
  github: githubFields,
  gitlab: (externalProjectId, tagConfig) => ({
    fields: { gitlabProjectId: externalProjectId, gitlabTagConfig: tagConfig },
  }),
  jira: (externalProjectId) => ({ fields: { jiraProjectKey: externalProjectId } }),
  plane: (externalProjectId, tagConfig) => ({
    fields: { planeProjectId: externalProjectId, planeTagConfig: tagConfig },
  }),
}

/**
 * Build platform-specific project mapping payload
 */
export const buildMappingPayload = (
  importerType: ImporterType,
  externalProjectId: string,
  lasiusProjectId: string,
  tagConfig?: TagConfig,
  externalProjectName?: string,
): MappingPayloadResult => {
  if (externalProjectId.trim() === '') {
    return { error: MISSING_EXTERNAL_PROJECT_ID, success: false }
  }

  const result = PLATFORM_FIELDS[importerType](externalProjectId, tagConfig)
  if ('error' in result) {
    return { error: result.error, success: false }
  }

  const payload: ModelsCreateProjectMapping = {
    externalProjectName: externalProjectName || null,
    githubRepoName: null,
    githubRepoOwner: null,
    githubTagConfig: undefined,
    gitlabProjectId: null,
    gitlabTagConfig: undefined,
    jiraProjectKey: null,
    maxResults: null,
    params: null,
    planeProjectId: null,
    planeTagConfig: undefined,
    projectId: lasiusProjectId,
    projectKeyPrefix: null,
    ...result.fields,
  }

  return {
    payload,
    success: true,
  }
}

const githubProjectId = (mapping: ProjectMapping): null | string => {
  const { githubRepoName, githubRepoOwner } = (mapping as ModelsGithubProjectMapping).settings
  return githubRepoOwner && githubRepoName ? `${githubRepoOwner}/${githubRepoName}` : null
}

const EXTERNAL_PROJECT_ID: Record<ImporterType, (mapping: ProjectMapping) => null | string> = {
  github: githubProjectId,
  gitlab: (mapping) => (mapping as ModelsGitlabProjectMapping).settings.gitlabProjectId || null,
  jira: (mapping) => (mapping as ModelsJiraProjectMapping).settings.jiraProjectKey || null,
  plane: (mapping) => (mapping as ModelsPlaneProjectMapping).settings.planeProjectId || null,
}

/**
 * Extract external project ID from a mapping object
 */
export const extractExternalProjectId = (
  importerType: ImporterType,
  mapping: ProjectMapping,
): null | string => {
  if (!mapping?.settings) {
    return null
  }
  return EXTERNAL_PROJECT_ID[importerType](mapping)
}

/**
 * Adds or replaces the mapping of one Lasius project under one external project. A replaced
 * mapping keeps its id, so a later removal can still delete it in the backend.
 */
export const upsertMappingEntry = (
  mappings: MappingsByExternalProject,
  externalProjectId: string,
  lasiusProjectId: string,
  tagConfig: TagConfig | undefined,
): MappingsByExternalProject => {
  const entries = mappings[externalProjectId] ?? []
  const existing = entries.find((m) => m.projectId === lasiusProjectId)
  return {
    ...mappings,
    [externalProjectId]: [
      ...entries.filter((m) => m.projectId !== lasiusProjectId),
      { id: existing?.id, projectId: lasiusProjectId, tagConfig },
    ],
  }
}

/**
 * Copies the backend id of each saved mapping into the local entry for the same pair. The local
 * rows stay as they are, so a late response can neither drop nor restore a row.
 */
export const applySavedIds = (
  local: MappingsByExternalProject,
  saved: MappingsByExternalProject,
): MappingsByExternalProject =>
  Object.fromEntries(
    Object.entries(local).map(([externalProjectId, entries]) => [
      externalProjectId,
      entries.map((entry) => {
        if (entry.id) return entry
        const match = saved[externalProjectId]?.find((s) => s.projectId === entry.projectId)
        return match?.id ? { ...entry, id: match.id } : entry
      }),
    ]),
  )

/**
 * Groups the saved mappings of a config by external project. One external project can map to
 * several Lasius projects (decision be-project-mapping-id).
 */
export const buildInitialMappings = (
  importerType: ImporterType,
  projects: ProjectMapping[],
): MappingsByExternalProject => {
  const result: MappingsByExternalProject = {}
  for (const mapping of projects) {
    const externalId = extractExternalProjectId(importerType, mapping)
    if (!externalId || !mapping.projectId) continue
    const tagConfig = (mapping.settings as unknown as { tagConfiguration?: TagConfig })
      ?.tagConfiguration
    result[externalId] = [
      ...(result[externalId] ?? []),
      { id: mapping.id, projectId: mapping.projectId, tagConfig },
    ]
  }
  return result
}

export type MappingStatEntry = {
  projectId: string
  stat?: ModelsProjectSyncStats
}

export const buildMappingStatsGroups = (
  importerType: ImporterType,
  mappings: ProjectMapping[],
  stats: ModelsProjectSyncStats[],
): Record<string, MappingStatEntry[]> => {
  const statsByProjectId = new Map(stats.map((s) => [s.projectId, s]))
  const groups: Record<string, MappingStatEntry[]> = {}

  for (const mapping of mappings) {
    const externalName = extractExternalProjectId(importerType, mapping) ?? mapping.projectId
    const entries = groups[externalName] ?? []
    entries.push({
      projectId: mapping.projectId,
      stat: statsByProjectId.get(mapping.projectId),
    })
    groups[externalName] = entries
  }

  return groups
}

const hasMapping = (mappings: MappingsByExternalProject, externalId: string) =>
  (mappings[externalId]?.length ?? 0) > 0

/** Mapped projects come first. The sort is stable, so each group keeps its order. */
export const sortMappedFirst = <T extends { id: string }>(
  projects: T[],
  mappings: MappingsByExternalProject,
): T[] =>
  projects.toSorted(
    (a, b) => Number(hasMapping(mappings, b.id)) - Number(hasMapping(mappings, a.id)),
  )
