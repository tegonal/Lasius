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

import { type TagConfig } from '~/features/integrations/lib/mapping-helpers'
import { type ImporterType } from '~/lib/utils/tag-helpers'

export type TagField = 'useAssignees' | 'useLabels' | 'useMilestone' | 'useTitle'

const COMMON_TAG_FIELDS: TagField[] = ['useTitle', 'useLabels', 'useMilestone']

/** The issue fields that can become tags. Only GitHub has assignees. */
export const getTagFieldKeys = (importerType: ImporterType): TagField[] =>
  importerType === 'github' ? [...COMMON_TAG_FIELDS, 'useAssignees'] : COMMON_TAG_FIELDS

export const getSelectedTagFields = (value: TagConfig, importerType: ImporterType): TagField[] => {
  const flags: Partial<Record<TagField, boolean>> = value
  return getTagFieldKeys(importerType).filter((field) => flags[field])
}

/** The config with the selected tag fields, or null. At least one field must stay selected. */
export const applyTagFields = (
  value: TagConfig,
  selectedValues: string[],
  importerType: ImporterType,
): null | TagConfig => {
  if (selectedValues.length === 0) return null
  return {
    ...value,
    useLabels: selectedValues.includes('useLabels'),
    useMilestone: selectedValues.includes('useMilestone'),
    useTitle: selectedValues.includes('useTitle'),
    ...(importerType === 'github' && {
      useAssignees: selectedValues.includes('useAssignees'),
    }),
  } satisfies TagConfig
}

/**
 * The selected values of each filter field, or null when the platform config has no such filter.
 * The label filter applies only while labels become tags.
 */
export const getTagConfigFilters = (value: TagConfig, selectedTagFields: TagField[]) => ({
  issueLabels:
    'includeOnlyIssuesWithLabels' in value ? value.includeOnlyIssuesWithLabels || [] : null,
  issueStates:
    'includeOnlyIssuesWithState' in value ? value.includeOnlyIssuesWithState || [] : null,
  labelFilter:
    selectedTagFields.includes('useLabels') && 'labelFilter' in value
      ? value.labelFilter || []
      : null,
})
