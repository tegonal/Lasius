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
import { MultiSelect, type MultiSelectOption } from '~/components/ui/forms/input/multi-select'
import { Select, type SelectOption } from '~/components/ui/forms/input/select'
import { TagConfigMetadataStatus } from '~/features/integrations/components/shared/tag-config-metadata-status'
import {
  type ImporterConfigReference,
  useExternalProjectMetadata,
} from '~/features/integrations/hooks/use-external-project-metadata'
import { type TagConfig } from '~/features/integrations/lib/mapping-helpers'
import {
  applyTagFields,
  getSelectedTagFields,
  getTagConfigFilters,
  getTagFieldKeys,
} from '~/features/integrations/lib/tag-config-fields'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import { type ModelsExternalProject } from '~/services/api/lasius'

type Properties = {
  externalProject: ModelsExternalProject
  importerConfig: ImporterConfigReference
  importerType: ImporterType
  onChange: (value: TagConfig) => void
  value: TagConfig
}

export const TagConfigForm = ({
  externalProject,
  importerConfig,
  importerType,
  onChange,
  value,
}: Properties) => {
  const { t } = useTranslation('integrations')
  const metadata = useExternalProjectMetadata(importerConfig, externalProject.id)
  const { availableLabels, availableStates } = metadata

  const tagFieldOptions: MultiSelectOption[] = useMemo(() => {
    const labels = {
      useAssignees: t('issueImporters.tagConfiguration.useAssignees', {
        defaultValue: 'Use assignees as tags',
      }),
      useLabels: t('issueImporters.tagConfiguration.useLabels', {
        defaultValue: 'Use labels as tags',
      }),
      useMilestone: t('issueImporters.tagConfiguration.useMilestone', {
        defaultValue: 'Use milestone as tag',
      }),
      useTitle: t('issueImporters.tagConfiguration.useTitle', {
        defaultValue: 'Use issue title as tag',
      }),
    }
    return getTagFieldKeys(importerType).map((field) => ({ label: labels[field], value: field }))
  }, [importerType, t])

  const selectedTagFields = useMemo(
    () => getSelectedTagFields(value, importerType),
    [value, importerType],
  )

  const handleTagFieldsChange = (selectedValues: string[]) => {
    const next = applyTagFields(value, selectedValues, importerType)
    if (next) onChange(next)
  }

  const labelOptions: MultiSelectOption[] = useMemo(
    () => availableLabels.map((label) => ({ label, value: label })),
    [availableLabels],
  )

  const stateOptions: (MultiSelectOption | SelectOption)[] = useMemo(
    () => availableStates.map((state) => ({ label: state, value: state })),
    [availableStates],
  )

  const filters = getTagConfigFilters(value, selectedTagFields)

  return (
    <FormBody>
      <FormElement
        htmlFor="tag-fields-select"
        label={t('issueImporters.tagConfiguration.tagFieldsLabel', {
          defaultValue: 'Tag fields to import',
        })}>
        <MultiSelect
          id="tag-fields-select"
          onChange={handleTagFieldsChange}
          options={tagFieldOptions}
          placeholder={t('issueImporters.tagConfiguration.tagFieldsPlaceholder', {
            defaultValue: 'Select fields...',
          })}
          value={selectedTagFields}
        />
        <p className="text-base-content/60 text-xs">
          {t('issueImporters.tagConfiguration.description', {
            defaultValue:
              'Configure which fields from external issues should be used to create tags in Lasius.',
          })}
        </p>
      </FormElement>

      <TagConfigMetadataStatus
        isError={metadata.isError}
        isLoading={metadata.isLoading}
        onRetry={metadata.reload}
      />

      <LabelFilterField
        help={t('issueImporters.tagConfiguration.labelFilterHelp', {
          defaultValue:
            'Leave empty to import all labels, or select specific labels to import only those.',
        })}
        id="label-filter-select"
        label={t('issueImporters.tagConfiguration.labelFilterLabel', {
          defaultValue: 'Import only specific labels',
        })}
        onChange={(selectedLabels) => onChange({ ...value, labelFilter: selectedLabels })}
        options={labelOptions}
        placeholder={t('issueImporters.tagConfiguration.labelFilterPlaceholder', {
          defaultValue: 'All labels (or select specific labels...)',
        })}
        value={filters.labelFilter}
      />

      <LabelFilterField
        help={t('issueImporters.tagConfiguration.issueLabelFilterHelp', {
          defaultValue:
            'Leave empty to import all issues, or select labels to import only issues that have at least one of these labels.',
        })}
        id="issue-label-filter-select"
        label={t('issueImporters.tagConfiguration.issueLabelFilterLabel', {
          defaultValue: 'Import only issues with specific labels',
        })}
        onChange={(selectedLabels) =>
          onChange({ ...value, includeOnlyIssuesWithLabels: selectedLabels })
        }
        options={labelOptions}
        placeholder={t('issueImporters.tagConfiguration.issueLabelFilterPlaceholder', {
          defaultValue: 'All issues (or select labels to filter...)',
        })}
        value={filters.issueLabels}
      />

      <IssueStateFilterField
        importerType={importerType}
        onChange={(selectedStates) =>
          onChange({ ...value, includeOnlyIssuesWithState: selectedStates })
        }
        options={stateOptions}
        value={filters.issueStates}
      />
    </FormBody>
  )
}

type LabelFilterFieldProperties = {
  help: string
  id: string
  label: string
  onChange: (selectedLabels: string[]) => void
  options: MultiSelectOption[]
  placeholder: string
  /** Null hides the field, because the config has no such filter. */
  value: null | string[]
}

const LabelFilterField = ({
  help,
  id,
  label,
  onChange,
  options,
  placeholder,
  value,
}: LabelFilterFieldProperties) => {
  if (!value) return null
  return (
    <FormElement htmlFor={id} label={label}>
      <MultiSelect
        disabled={options.length === 0}
        id={id}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        value={value}
      />
      <p className="text-base-content/60 text-xs">{help}</p>
    </FormElement>
  )
}

type IssueStateFilterFieldProperties = {
  importerType: ImporterType
  onChange: (selectedStates: string[]) => void
  options: (MultiSelectOption | SelectOption)[]
  /** Null hides the field, because the config has no such filter. */
  value: null | string[]
}

// Plane filters by several states. The other platforms filter by one state.
const IssueStateFilterField = ({
  importerType,
  onChange,
  options,
  value,
}: IssueStateFilterFieldProperties) => {
  const { t } = useTranslation('integrations')
  if (!value) return null
  const placeholder = t('issueImporters.tagConfiguration.issueStateFilterPlaceholder', {
    defaultValue: 'All states (or select specific states...)',
  })
  return (
    <FormElement
      htmlFor="issue-state-filter-select"
      label={t('issueImporters.tagConfiguration.issueStateFilterLabel', {
        defaultValue: 'Import only issues with specific states',
      })}>
      {importerType === 'plane' ? (
        <MultiSelect
          disabled={options.length === 0}
          id="issue-state-filter-select"
          onChange={onChange}
          options={options}
          placeholder={placeholder}
          value={value}
        />
      ) : (
        <Select
          disabled={options.length === 0}
          id="issue-state-filter-select"
          onChange={(selectedState) => onChange(selectedState ? [selectedState] : [])}
          options={options}
          placeholder={placeholder}
          value={value[0] || ''}
        />
      )}
      <p className="text-base-content/60 text-xs">
        {t('issueImporters.tagConfiguration.issueStateFilterHelp', {
          defaultValue:
            'Leave empty to import all issues, or select states to import only issues in those states.',
        })}
      </p>
    </FormElement>
  )
}
