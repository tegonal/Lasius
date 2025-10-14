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
  ModelsGithubTagConfiguration,
  ModelsGitlabTagConfiguration,
  ModelsPlaneTagConfiguration,
} from 'lib/api/lasius'

export const getDefaultTagConfiguration = (
  importerType: ImporterType,
):
  | ModelsGithubTagConfiguration
  | ModelsGitlabTagConfiguration
  | ModelsPlaneTagConfiguration
  | undefined => {
  switch (importerType) {
    case 'github':
      return {
        useLabels: false,
        labelFilter: [],
        useMilestone: false,
        useTitle: true,
        useAssignees: false,
        includeOnlyIssuesWithLabels: [],
        includeOnlyIssuesWithState: ['open'], // Default to open issues only
      } satisfies ModelsGithubTagConfiguration

    case 'gitlab':
      return {
        useLabels: false,
        labelFilter: [],
        useMilestone: false,
        useTitle: true,
        includeOnlyIssuesWithLabels: [],
        includeOnlyIssuesWithState: [],
      } satisfies ModelsGitlabTagConfiguration

    case 'plane':
      return {
        useLabels: false,
        labelFilter: [],
        useMilestone: false,
        useTitle: true,
        includeOnlyIssuesWithLabels: [],
        includeOnlyIssuesWithState: [],
      } satisfies ModelsPlaneTagConfiguration

    case 'jira':
      // Jira doesn't use tag configuration in the same way
      return undefined

    default:
      return undefined
  }
}
