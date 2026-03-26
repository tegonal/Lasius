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

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import {
  MultiSelect,
  type MultiSelectOption,
} from '~/components/ui/forms/input/multi-select'
import { Select, type SelectOption } from '~/components/ui/forms/input/select'
import { type TagConfiguration } from '~/features/integrations/lib/mapping-helpers'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import {
  type ModelsExternalProject,
  type ModelsGithubTagConfiguration,
} from '~/services/api/lasius'

type Props = {
  externalProject?: ModelsExternalProject
  importerType: ImporterType
  onChange: (value: TagConfiguration) => void
  value: TagConfiguration
}

export const TagConfigurationForm = ({
  externalProject,
  importerType,
  onChange,
  value,
}: Props) => {
  const { t } = useTranslation('integrations')

  const tagFieldOptions: MultiSelectOption[] = useMemo(() => {
    const options: MultiSelectOption[] = [
      {
        label: t('issueImporters.tagConfiguration.useTitle', {
          defaultValue: 'Use issue title as tag',
        }),
        value: 'useTitle',
      },
      {
        label: t('issueImporters.tagConfiguration.useLabels', {
          defaultValue: 'Use labels as tags',
        }),
        value: 'useLabels',
      },
      {
        label: t('issueImporters.tagConfiguration.useMilestone', {
          defaultValue: 'Use milestone as tag',
        }),
        value: 'useMilestone',
      },
    ]

    if (importerType === 'github') {
      options.push({
        label: t('issueImporters.tagConfiguration.useAssignees', {
          defaultValue: 'Use assignees as tags',
        }),
        value: 'useAssignees',
      })
    }

    return options
  }, [importerType, t])

  const selectedTagFields = useMemo(() => {
    const selected: string[] = []
    if (value.useTitle) selected.push('useTitle')
    if (value.useLabels) selected.push('useLabels')
    if (value.useMilestone) selected.push('useMilestone')
    if (
      importerType === 'github' &&
      (value as ModelsGithubTagConfiguration).useAssignees
    ) {
      selected.push('useAssignees')
    }
    return selected
  }, [value, importerType])

  const handleTagFieldsChange = (selectedValues: string[]) => {
    if (selectedValues.length === 0) {
      return
    }

    onChange({
      ...value,
      useLabels: selectedValues.includes('useLabels'),
      useMilestone: selectedValues.includes('useMilestone'),
      useTitle: selectedValues.includes('useTitle'),
      ...(importerType === 'github' && {
        useAssignees: selectedValues.includes('useAssignees'),
      }),
    } as TagConfiguration)
  }

  const availableLabels = externalProject?.availableLabels ?? []
  const availableStates = externalProject?.availableStates ?? []

  const labelOptions: MultiSelectOption[] = useMemo(
    () => availableLabels.map((label) => ({ label, value: label })),
    [availableLabels],
  )

  const stateOptions: (MultiSelectOption | SelectOption)[] = useMemo(
    () => availableStates.map((state) => ({ label: state, value: state })),
    [availableStates],
  )

  return (
    <FormBody>
      <FormElement
        htmlFor="tag-fields-select"
        label={t('issueImporters.tagConfiguration.tagFieldsLabel', {
          defaultValue: 'Tag fields to import',
        })}
      >
        <MultiSelect
          id="tag-fields-select"
          onChange={handleTagFieldsChange}
          options={tagFieldOptions}
          placeholder={t(
            'issueImporters.tagConfiguration.tagFieldsPlaceholder',
            {
              defaultValue: 'Select fields...',
            },
          )}
          value={selectedTagFields}
        />
        <p className="text-base-content/60 text-xs">
          {t('issueImporters.tagConfiguration.description', {
            defaultValue:
              'Configure which fields from external issues should be used to create tags in Lasius.',
          })}
        </p>
      </FormElement>

      {selectedTagFields.includes('useLabels') && 'labelFilter' in value && (
        <FormElement
          htmlFor="label-filter-select"
          label={t('issueImporters.tagConfiguration.labelFilterLabel', {
            defaultValue: 'Import only specific labels',
          })}
        >
          <MultiSelect
            disabled={availableLabels.length === 0}
            id="label-filter-select"
            onChange={(selectedLabels) =>
              onChange({
                ...value,
                labelFilter: selectedLabels,
              })
            }
            options={labelOptions}
            placeholder={t(
              'issueImporters.tagConfiguration.labelFilterPlaceholder',
              {
                defaultValue: 'All labels (or select specific labels...)',
              },
            )}
            value={value.labelFilter || []}
          />
          <p className="text-base-content/60 text-xs">
            {t('issueImporters.tagConfiguration.labelFilterHelp', {
              defaultValue:
                'Leave empty to import all labels, or select specific labels to import only those.',
            })}
          </p>
        </FormElement>
      )}

      {'includeOnlyIssuesWithLabels' in value && (
        <FormElement
          htmlFor="issue-label-filter-select"
          label={t('issueImporters.tagConfiguration.issueLabelFilterLabel', {
            defaultValue: 'Import only issues with specific labels',
          })}
        >
          <MultiSelect
            disabled={availableLabels.length === 0}
            id="issue-label-filter-select"
            onChange={(selectedLabels) =>
              onChange({
                ...value,
                includeOnlyIssuesWithLabels: selectedLabels,
              })
            }
            options={labelOptions}
            placeholder={t(
              'issueImporters.tagConfiguration.issueLabelFilterPlaceholder',
              {
                defaultValue: 'All issues (or select labels to filter...)',
              },
            )}
            value={value.includeOnlyIssuesWithLabels || []}
          />
          <p className="text-base-content/60 text-xs">
            {t('issueImporters.tagConfiguration.issueLabelFilterHelp', {
              defaultValue:
                'Leave empty to import all issues, or select labels to import only issues that have at least one of these labels.',
            })}
          </p>
        </FormElement>
      )}

      {'includeOnlyIssuesWithState' in value && (
        <FormElement
          htmlFor="issue-state-filter-select"
          label={t('issueImporters.tagConfiguration.issueStateFilterLabel', {
            defaultValue: 'Import only issues with specific states',
          })}
        >
          {importerType === 'plane' ? (
            <MultiSelect
              disabled={availableStates.length === 0}
              id="issue-state-filter-select"
              onChange={(selectedStates) =>
                onChange({
                  ...value,
                  includeOnlyIssuesWithState: selectedStates,
                })
              }
              options={stateOptions}
              placeholder={t(
                'issueImporters.tagConfiguration.issueStateFilterPlaceholder',
                {
                  defaultValue: 'All states (or select specific states...)',
                },
              )}
              value={value.includeOnlyIssuesWithState || []}
            />
          ) : (
            <Select
              disabled={availableStates.length === 0}
              id="issue-state-filter-select"
              onChange={(selectedState) =>
                onChange({
                  ...value,
                  includeOnlyIssuesWithState: selectedState
                    ? [selectedState]
                    : [],
                })
              }
              options={stateOptions}
              placeholder={t(
                'issueImporters.tagConfiguration.issueStateFilterPlaceholder',
                {
                  defaultValue: 'All states (or select specific states...)',
                },
              )}
              value={value.includeOnlyIssuesWithState?.[0] || ''}
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
  )
}
