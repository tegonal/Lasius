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
import type { ModelsTag } from 'lib/api/lasius'

/**
 * Checks if a tag is from an issue importer
 */
export function isImporterTag(tag: ModelsTag): boolean {
  return (
    tag.type === 'GithubIssueTag' ||
    tag.type === 'GitlabIssueTag' ||
    tag.type === 'JiraIssueTag' ||
    tag.type === 'PlaneIssueTag'
  )
}

/**
 * Gets the importer type from an importer tag
 * Returns null if the tag is not from an importer
 */
export function getImporterTypeFromTag(tag: ModelsTag): ImporterType | null {
  switch (tag.type) {
    case 'GithubIssueTag':
      return 'github'
    case 'GitlabIssueTag':
      return 'gitlab'
    case 'JiraIssueTag':
      return 'jira'
    case 'PlaneIssueTag':
      return 'plane'
    default:
      return null
  }
}
