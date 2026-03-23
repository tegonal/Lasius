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
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  InputSelectAutocomplete,
  type SelectAutocompleteSuggestionType,
} from '~/components/ui/forms/input/input-select-autocomplete'
import { type ModelsEntityReference } from '~/services/api/lasius'

type ProjectSelectProps = {
  /** All projects across all organisations (for inactive project lookup) */
  allProjects?: ModelsEntityReference[]
  fallbackProject?: SelectAutocompleteSuggestionType
  id?: string
  name: string
  /** Active projects for the current organisation (suggestions list) */
  projects: ModelsEntityReference[]
  required?: boolean
}

/**
 * Domain-specific wrapper for InputSelectAutocomplete to handle project selection.
 * Handles finding projects in active list, inactive projects, and fallback projects.
 */
export const ProjectSelect = ({
  allProjects = [],
  fallbackProject,
  id,
  name,
  projects,
  required,
}: ProjectSelectProps) => {
  const { t } = useTranslation('common')
  const formContext = useFormContext()

  const formValue = formContext?.watch(name)

  const { selectedItem, statusMessage } = useMemo(() => {
    if (!formValue) {
      return { selectedItem: null, statusMessage: null }
    }

    // First try to find in suggestions (active projects)
    let item = projects.find((p) => p.id === formValue)
    if (item) {
      return { selectedItem: item, statusMessage: null }
    }

    // If not found in suggestions, try to find it in all projects (inactive projects)
    item = allProjects.find((p) => p.id === formValue)
    if (item) {
      return {
        selectedItem: item,
        statusMessage: {
          text: t('projects.warnings.projectNotInActiveList', {
            defaultValue:
              'This project is not in your active projects list. It may be inactive or from another organization.',
          }),
          variant: 'info' as const,
        },
      }
    }

    // If still not found, use fallbackProject if it matches the formValue (project from booking, not in profile)
    if (fallbackProject && fallbackProject.id === formValue) {
      return {
        selectedItem: fallbackProject,
        statusMessage: {
          text: t('projects.warnings.projectUnavailable', {
            defaultValue:
              'This project is no longer in your profile. You may have been removed from it.',
          }),
          variant: 'warning' as const,
        },
      }
    }

    // Project not found anywhere
    return {
      selectedItem: null,
      statusMessage: {
        text: t('projects.errors.projectNotFound', {
          defaultValue:
            'This project could not be found. The project ID is shown above.',
        }),
        variant: 'error' as const,
      },
    }
  }, [formValue, projects, allProjects, fallbackProject, t])

  return (
    <InputSelectAutocomplete
      id={id}
      name={name}
      required={required}
      selectedItem={selectedItem}
      statusMessage={statusMessage}
      suggestions={projects}
    />
  )
}
