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

import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { MultiSelect, type MultiSelectOption } from 'components/ui/forms/input/MultiSelect'
import { Select } from 'components/ui/forms/input/Select'
import { useTranslation } from 'next-i18next'
import React, { useMemo } from 'react'

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type {
  ModelsExternalProject,
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
  externalProject?: ModelsExternalProject
}

export const TagConfigurationForm: React.FC<Props> = ({
  importerType,
  value,
  onChange,
  externalProject,
}) => {
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
    // Require at least one selection
    if (selectedValues.length === 0) {
      return
    }

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

  return (
    <>
      <FormBody>
        <FormElement
          label={t('issueImporters.tagConfiguration.tagFieldsLabel', {
            defaultValue: 'Tag fields to import',
          })}
          htmlFor="tag-fields-select">
          <MultiSelect
            id="tag-fields-select"
            value={selectedTagFields}
            onChange={handleTagFieldsChange}
            options={tagFieldOptions}
            placeholder={t('issueImporters.tagConfiguration.tagFieldsPlaceholder', {
              defaultValue: 'Select fields...',
            })}
          />
          <p className="text-base-content/60 text-xs">
            {t('issueImporters.tagConfiguration.description', {
              defaultValue:
                'Configure which fields from external issues should be used to create tags in Lasius.',
            })}
          </p>
        </FormElement>

        {/* Label filter - filter which labels to import as tags */}
        {selectedTagFields.includes('useLabels') && 'labelFilter' in value && (
          <FormElement
            label={t('issueImporters.tagConfiguration.labelFilterLabel', {
              defaultValue: 'Import only specific labels',
            })}
            htmlFor="label-filter-select">
            <MultiSelect
              id="label-filter-select"
              value={value.labelFilter || []}
              onChange={(selectedLabels) =>
                onChange({
                  ...value,
                  labelFilter: selectedLabels,
                })
              }
              options={
                externalProject?.availableLabels?.map((label) => ({
                  value: label,
                  label,
                })) || []
              }
              placeholder={t('issueImporters.tagConfiguration.labelFilterPlaceholder', {
                defaultValue: 'All labels (or select specific labels...)',
              })}
              disabled={
                !externalProject?.availableLabels || externalProject.availableLabels.length === 0
              }
            />
            <p className="text-base-content/60 text-xs">
              {t('issueImporters.tagConfiguration.labelFilterHelp', {
                defaultValue:
                  'Leave empty to import all labels, or select specific labels to import only those.',
              })}
            </p>
          </FormElement>
        )}

        {/* Issue label filter - filter which issues to import based on labels */}
        {'includeOnlyIssuesWithLabels' in value && (
          <FormElement
            label={t('issueImporters.tagConfiguration.issueLabelFilterLabel', {
              defaultValue: 'Import only issues with specific labels',
            })}
            htmlFor="issue-label-filter-select">
            <MultiSelect
              id="issue-label-filter-select"
              value={value.includeOnlyIssuesWithLabels || []}
              onChange={(selectedLabels) =>
                onChange({
                  ...value,
                  includeOnlyIssuesWithLabels: selectedLabels,
                })
              }
              options={
                externalProject?.availableLabels?.map((label) => ({
                  value: label,
                  label,
                })) || []
              }
              placeholder={t('issueImporters.tagConfiguration.issueLabelFilterPlaceholder', {
                defaultValue: 'All issues (or select labels to filter...)',
              })}
              disabled={
                !externalProject?.availableLabels || externalProject.availableLabels.length === 0
              }
            />
            <p className="text-base-content/60 text-xs">
              {t('issueImporters.tagConfiguration.issueLabelFilterHelp', {
                defaultValue:
                  'Leave empty to import all issues, or select labels to import only issues that have at least one of these labels.',
              })}
            </p>
          </FormElement>
        )}

        {/* Issue state filter - filter which issues to import based on state */}
        {'includeOnlyIssuesWithState' in value && (
          <FormElement
            label={t('issueImporters.tagConfiguration.issueStateFilterLabel', {
              defaultValue: 'Import only issues with specific states',
            })}
            htmlFor="issue-state-filter-select">
            {importerType === 'plane' ? (
              <MultiSelect
                id="issue-state-filter-select"
                value={value.includeOnlyIssuesWithState || []}
                onChange={(selectedStates) =>
                  onChange({
                    ...value,
                    includeOnlyIssuesWithState: selectedStates,
                  })
                }
                options={
                  externalProject?.availableStates?.map((state) => ({
                    value: state,
                    label: state,
                  })) || []
                }
                placeholder={t('issueImporters.tagConfiguration.issueStateFilterPlaceholder', {
                  defaultValue: 'All states (or select specific states...)',
                })}
                disabled={
                  !externalProject?.availableStates || externalProject.availableStates.length === 0
                }
              />
            ) : (
              <Select
                id="issue-state-filter-select"
                value={value.includeOnlyIssuesWithState?.[0] || ''}
                onChange={(selectedState) =>
                  onChange({
                    ...value,
                    includeOnlyIssuesWithState: selectedState ? [selectedState] : [],
                  })
                }
                options={
                  externalProject?.availableStates?.map((state) => ({
                    value: state,
                    label: state,
                  })) || []
                }
                placeholder={t('issueImporters.tagConfiguration.issueStateFilterPlaceholder', {
                  defaultValue: 'All states (or select specific states...)',
                })}
                disabled={
                  !externalProject?.availableStates || externalProject.availableStates.length === 0
                }
              />
            )}
            <p className="text-base-content/60 text-xs">
              {t('issueImporters.tagConfiguration.issueStateFilterHelp', {
                defaultValue:
                  'Leave empty to import all issues, or select states to import only issues in those states.',
              })}
            </p>
          </FormElement>
        )}
      </FormBody>
    </>
  )
}
