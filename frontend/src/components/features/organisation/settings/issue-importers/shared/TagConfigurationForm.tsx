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

import { MultiSelect, type MultiSelectOption } from 'components/ui/forms/input/MultiSelect'
import { Select, type SelectOption } from 'components/ui/forms/input/Select'
import { useTranslation } from 'next-i18next'
import React, { useMemo } from 'react'

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type {
  ModelsGithubTagConfiguration,
  ModelsGitlabTagConfiguration,
  ModelsPlaneTagConfiguration,
} from 'lib/api/lasius'

type TagConfiguration =
  | ModelsGithubTagConfiguration
  | ModelsGitlabTagConfiguration
  | ModelsPlaneTagConfiguration

type Props = {
  importerType: ImporterType
  value: TagConfiguration
  onChange: (value: TagConfiguration) => void
}

export const TagConfigurationForm: React.FC<Props> = ({ importerType, value, onChange }) => {
  const { t } = useTranslation('integrations')

  // Tag field options for multiselect
  const tagFieldOptions: MultiSelectOption[] = useMemo(() => {
    const options: MultiSelectOption[] = [
      {
        value: 'useTitle',
        label: t('issueImporters.tagConfiguration.useTitle', {
          defaultValue: 'Use issue title as tag',
        }),
      },
      {
        value: 'useLabels',
        label: t('issueImporters.tagConfiguration.useLabels', {
          defaultValue: 'Use labels as tags',
        }),
      },
      {
        value: 'useMilestone',
        label: t('issueImporters.tagConfiguration.useMilestone', {
          defaultValue: 'Use milestone as tag',
        }),
      },
    ]

    if (importerType === 'github') {
      options.push({
        value: 'useAssignees',
        label: t('issueImporters.tagConfiguration.useAssignees', {
          defaultValue: 'Use assignees as tags',
        }),
      })
    }

    return options
  }, [importerType, t])

  // Get currently selected tag fields
  const selectedTagFields = useMemo(() => {
    const selected: string[] = []
    if (value.useTitle) selected.push('useTitle')
    if (value.useLabels) selected.push('useLabels')
    if (value.useMilestone) selected.push('useMilestone')
    if (importerType === 'github' && (value as ModelsGithubTagConfiguration).useAssignees) {
      selected.push('useAssignees')
    }
    return selected
  }, [value, importerType])

  const handleTagFieldsChange = (selectedValues: string[]) => {
    onChange({
      ...value,
      useTitle: selectedValues.includes('useTitle'),
      useLabels: selectedValues.includes('useLabels'),
      useMilestone: selectedValues.includes('useMilestone'),
      ...(importerType === 'github' && {
        useAssignees: selectedValues.includes('useAssignees'),
      }),
    } as TagConfiguration)
  }

  // Issue state options
  const issueStateOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'all',
        label: t('issueImporters.tagConfiguration.issueState.all', { defaultValue: 'All issues' }),
      },
      {
        value: 'open',
        label: t('issueImporters.tagConfiguration.issueState.open', {
          defaultValue: 'Open issues only',
        }),
      },
      {
        value: 'closed',
        label: t('issueImporters.tagConfiguration.issueState.closed', {
          defaultValue: 'Closed issues only',
        }),
      },
    ],
    [t],
  )

  // Get current issue state value (array -> single value for select)
  const currentIssueState = useMemo(() => {
    if (value.includeOnlyIssuesWithState.length === 0) {
      return 'all'
    }
    return value.includeOnlyIssuesWithState[0] || 'open'
  }, [value.includeOnlyIssuesWithState])

  const handleIssueStateChange = (state: string) => {
    onChange({
      ...value,
      includeOnlyIssuesWithState: state === 'all' ? [] : [state],
    })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="tag-fields-select" className="text-sm font-medium">
          {t('issueImporters.tagConfiguration.tagFieldsLabel', {
            defaultValue: 'Tag fields to import',
          })}
        </label>
        <MultiSelect
          id="tag-fields-select"
          value={selectedTagFields}
          onChange={handleTagFieldsChange}
          options={tagFieldOptions}
          placeholder={t('issueImporters.tagConfiguration.tagFieldsPlaceholder', {
            defaultValue: 'Select fields...',
          })}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="issue-state-select" className="text-sm font-medium">
          {t('issueImporters.tagConfiguration.issueStateLabel', {
            defaultValue: 'Issue state to import',
          })}
        </label>
        <Select
          id="issue-state-select"
          value={currentIssueState}
          onChange={handleIssueStateChange}
          options={issueStateOptions}
        />
      </div>

      <p className="text-base-content/60 text-xs">
        {t('issueImporters.tagConfiguration.description', {
          defaultValue:
            'Configure which fields from external issues should be used to create tags in Lasius.',
        })}
      </p>
    </div>
  )
}
