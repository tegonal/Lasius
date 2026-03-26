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
  type ModelsGithubTagConfiguration,
  type ModelsGitlabTagConfiguration,
  type ModelsPlaneTagConfiguration,
} from '~/services/api/lasius'

export const getDefaultTagConfiguration = (
  importerType: ImporterType,
):
  | ModelsGithubTagConfiguration
  | ModelsGitlabTagConfiguration
  | ModelsPlaneTagConfiguration
  | undefined => {
  switch (importerType) {
    case 'github': {
      return {
        includeOnlyIssuesWithLabels: [],
        includeOnlyIssuesWithState: ['open'],
        labelFilter: [],
        useAssignees: false,
        useLabels: false,
        useMilestone: false,
        useTitle: true,
      } satisfies ModelsGithubTagConfiguration
    }

    case 'gitlab': {
      return {
        includeOnlyIssuesWithLabels: [],
        includeOnlyIssuesWithState: [],
        labelFilter: [],
        useLabels: false,
        useMilestone: false,
        useTitle: true,
      } satisfies ModelsGitlabTagConfiguration
    }

    case 'jira': {
      return undefined
    }

    case 'plane': {
      return {
        includeOnlyIssuesWithLabels: [],
        includeOnlyIssuesWithState: [],
        labelFilter: [],
        useLabels: false,
        useMilestone: false,
        useTitle: true,
      } satisfies ModelsPlaneTagConfiguration
    }
  }
}
