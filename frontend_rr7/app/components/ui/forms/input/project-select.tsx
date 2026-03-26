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

import {
  InputSelectAutocomplete,
  type SelectAutocompleteSuggestionType,
} from '~/components/ui/forms/input/input-select-autocomplete'
import { type ModelsEntityReference } from '~/services/api/lasius'

type ProjectSelectProps = {
  /** All projects across all organisations (for inactive project lookup) */
  allProjects?: ModelsEntityReference[]
  errors?: string[]
  fallbackProject?: SelectAutocompleteSuggestionType
  id?: string
  name: string
  onChange: (value: string) => void
  /** Active projects for the current organisation (suggestions list) */
  projects: ModelsEntityReference[]
  value: string
}

function useProjectLookup(
  formValue: string,
  projects: ModelsEntityReference[],
  allProjects: ModelsEntityReference[],
  fallbackProject: SelectAutocompleteSuggestionType | undefined,
) {
  const { t } = useTranslation('common')

  return useMemo(() => {
    if (!formValue) {
      return { selectedItem: null, statusMessage: null }
    }

    let item = projects.find((p) => p.id === formValue)
    if (item) {
      return { selectedItem: item, statusMessage: null }
    }

    item = allProjects.find((p) => p.id === formValue)
    if (item) {
      return {
        selectedItem: item,
        statusMessage: {
          text: t('projects:warnings.projectNotInActiveList', {
            defaultValue:
              'This project is not in your active projects list. It may be inactive or from another organization.',
          }),
          variant: 'info' as const,
        },
      }
    }

    if (fallbackProject && fallbackProject.id === formValue) {
      return {
        selectedItem: fallbackProject,
        statusMessage: {
          text: t('projects:warnings.projectUnavailable', {
            defaultValue:
              'This project is no longer in your profile. You may have been removed from it.',
          }),
          variant: 'warning' as const,
        },
      }
    }

    return {
      selectedItem: null,
      statusMessage: {
        text: t('projects:errors.projectNotFound', {
          defaultValue:
            'This project could not be found. The project ID is shown above.',
        }),
        variant: 'error' as const,
      },
    }
  }, [formValue, projects, allProjects, fallbackProject, t])
}

/**
 * Domain-specific wrapper for InputSelectAutocomplete to handle project selection.
 * Controlled component — parent owns the value via useInputControl.
 */
export const ProjectSelect = ({
  allProjects = [],
  errors,
  fallbackProject,
  id,
  name,
  onChange,
  projects,
  value,
}: ProjectSelectProps) => {
  const { selectedItem, statusMessage } = useProjectLookup(
    value,
    projects,
    allProjects,
    fallbackProject,
  )

  return (
    <InputSelectAutocomplete
      errors={errors}
      id={id}
      name={name}
      onChange={onChange}
      selectedItem={selectedItem}
      statusMessage={statusMessage}
      suggestions={projects}
      value={value}
    />
  )
}
