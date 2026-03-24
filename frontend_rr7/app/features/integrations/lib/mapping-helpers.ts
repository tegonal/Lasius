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
  type ModelsGithubTagConfiguration,
  type ModelsGitlabTagConfiguration,
  type ModelsPlaneTagConfiguration,
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

export type TagConfiguration =
  | ModelsGithubTagConfiguration
  | ModelsGitlabTagConfiguration
  | ModelsPlaneTagConfiguration

/**
 * Build platform-specific project mapping payload
 */
export const buildMappingPayload = (
  importerType: ImporterType,
  externalProjectId: string,
  lasiusProjectId: string,
  tagConfig?: TagConfiguration,
  externalProjectName?: string,
): MappingPayloadResult => {
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
  }

  switch (importerType) {
    case 'github': {
      const [owner, repo] = externalProjectId.split('/')
      if (!owner || !repo) {
        return {
          error: 'Invalid GitHub repository format. Expected "owner/repo"',
          success: false,
        }
      }
      payload.githubRepoOwner = owner
      payload.githubRepoName = repo
      if (tagConfig) {
        payload.githubTagConfig = tagConfig as ModelsGithubTagConfiguration
      }
      break
    }

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
  }

  return {
    payload,
    success: true,
  }
}

/**
 * Extract external project ID from a mapping object
 */
export const extractExternalProjectId = (
  importerType: ImporterType,

  mapping: any,
): null | string => {
  if (!mapping?.settings) {
    return null
  }

  switch (importerType) {
    case 'github': {
      const owner = mapping.settings.githubRepoOwner
      const repo = mapping.settings.githubRepoName
      return owner && repo ? `${owner}/${repo}` : null
    }

    case 'gitlab':
      return mapping.settings.gitlabProjectId || null

    case 'jira':
      return mapping.settings.jiraProjectKey || null

    case 'plane':
      return mapping.settings.planeProjectId || null

    default:
      return null
  }
}
