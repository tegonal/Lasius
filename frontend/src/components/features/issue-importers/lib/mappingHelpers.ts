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

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type {
  ModelsCreateProjectMapping,
  ModelsGithubTagConfiguration,
  ModelsGitlabTagConfiguration,
  ModelsPlaneTagConfiguration,
} from 'lib/api/lasius'

export type TagConfiguration =
  | ModelsGithubTagConfiguration
  | ModelsGitlabTagConfiguration
  | ModelsPlaneTagConfiguration

export type MappingPayloadResult =
  | {
      success: true
      payload: ModelsCreateProjectMapping
    }
  | {
      success: false
      error: string
    }

/**
 * Build platform-specific project mapping payload
 *
 * @param importerType - Platform type (github, gitlab, jira, plane)
 * @param externalProjectId - External project identifier (format varies by platform)
 * @param lasiusProjectId - Lasius project ID to map to
 * @param tagConfig - Optional tag configuration for the mapping
 * @param externalProjectName - Optional external project name (e.g., "facebook/react" for GitHub)
 * @returns Result object with payload or error
 */
export const buildMappingPayload = (
  importerType: ImporterType,
  externalProjectId: string,
  lasiusProjectId: string,
  tagConfig?: TagConfiguration,
  externalProjectName?: string,
): MappingPayloadResult => {
  // Initialize with all fields as null
  const payload: ModelsCreateProjectMapping = {
    projectId: lasiusProjectId,
    externalProjectName: externalProjectName || null,
    gitlabProjectId: null,
    projectKeyPrefix: null,
    gitlabTagConfig: undefined,
    jiraProjectKey: null,
    planeProjectId: null,
    planeTagConfig: undefined,
    githubRepoOwner: null,
    githubRepoName: null,
    githubTagConfig: undefined,
    maxResults: null,
    params: null,
  }

  // Set platform-specific fields
  switch (importerType) {
    case 'gitlab': {
      payload.gitlabProjectId = externalProjectId
      if (tagConfig) {
        payload.gitlabTagConfig = tagConfig as ModelsGitlabTagConfiguration
      }
      break
    }

    case 'jira': {
      payload.jiraProjectKey = externalProjectId
      break
    }

    case 'plane': {
      payload.planeProjectId = externalProjectId
      if (tagConfig) {
        payload.planeTagConfig = tagConfig as ModelsPlaneTagConfiguration
      }
      break
    }

    case 'github': {
      // GitHub project IDs are in "owner/repo" format
      const [owner, repo] = externalProjectId.split('/')
      if (!owner || !repo) {
        return {
          success: false,
          error: 'Invalid GitHub repository format. Expected "owner/repo"',
        }
      }
      payload.githubRepoOwner = owner
      payload.githubRepoName = repo
      if (tagConfig) {
        payload.githubTagConfig = tagConfig as ModelsGithubTagConfiguration
      }
      break
    }
  }

  return {
    success: true,
    payload,
  }
}

/**
 * Extract external project ID from a mapping object
 *
 * @param importerType - Platform type
 * @param mapping - Mapping object from API
 * @returns External project ID or null if not found
 */
export const extractExternalProjectId = (
  importerType: ImporterType,
  mapping: any,
): string | null => {
  if (!mapping?.settings) {
    return null
  }

  switch (importerType) {
    case 'gitlab':
      return mapping.settings.gitlabProjectId || null

    case 'jira':
      return mapping.settings.jiraProjectKey || null

    case 'plane':
      return mapping.settings.planeProjectId || null

    case 'github': {
      const owner = mapping.settings.githubRepoOwner
      const repo = mapping.settings.githubRepoName
      return owner && repo ? `${owner}/${repo}` : null
    }

    default:
      return null
  }
}

/**
 * Extract tag configuration from a mapping object
 *
 * @param mapping - Mapping object from API
 * @returns Tag configuration or undefined
 */
export const extractTagConfig = (mapping: any): TagConfiguration | undefined => {
  return mapping?.settings?.tagConfiguration
}

/**
 * Check if an external project matches a mapping
 *
 * @param importerType - Platform type
 * @param externalProjectId - External project ID to check
 * @param mapping - Mapping object from API
 * @returns True if the mapping matches the external project
 */
export const mappingMatchesProject = (
  importerType: ImporterType,
  externalProjectId: string,
  mapping: any,
): boolean => {
  if (!mapping?.settings) {
    return false
  }

  switch (importerType) {
    case 'gitlab':
      return mapping.settings.gitlabProjectId === externalProjectId

    case 'jira':
      return mapping.settings.jiraProjectKey === externalProjectId

    case 'plane':
      return mapping.settings.planeProjectId === externalProjectId

    case 'github': {
      // GitHub uses owner/repo format
      const [owner, repo] = externalProjectId.split('/')
      return mapping.settings.githubRepoOwner === owner && mapping.settings.githubRepoName === repo
    }

    default:
      return false
  }
}
