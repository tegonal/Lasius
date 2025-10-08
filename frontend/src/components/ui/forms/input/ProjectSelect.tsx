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

import { find } from 'es-toolkit/compat'
import { useProjects } from 'lib/api/hooks/useProjects'
import { useTranslation } from 'next-i18next'
import React, { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  InputSelectAutocomplete,
  SelectAutocompleteSuggestionType,
} from './InputSelectAutocomplete'

type Props = {
  name: string
  required?: boolean
  id?: string
  fallbackProject?: SelectAutocompleteSuggestionType
}

/**
 * Domain-specific wrapper for InputSelectAutocomplete to handle project selection
 * Handles finding projects in active list, inactive projects, and fallback projects
 */
export const ProjectSelect: React.FC<Props> = ({ name, required, id, fallbackProject }) => {
  const { t } = useTranslation('common')
  const { projectSuggestions, findProjectById } = useProjects()
  const formContext = useFormContext()

  const suggestions = projectSuggestions()
  const formValue = formContext?.watch(name)

  const { selectedItem, statusMessage } = useMemo(() => {
    if (!formValue) {
      return { selectedItem: null, statusMessage: null }
    }

    // First try to find in suggestions (active projects)
    let item = find(suggestions, { id: formValue })
    if (item) {
      return { selectedItem: item, statusMessage: null }
    }

    // If not found in suggestions, try to find it (inactive projects in profile)
    item = findProjectById(formValue)
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
          defaultValue: 'This project could not be found. The project ID is shown above.',
        }),
        variant: 'error' as const,
      },
    }
  }, [formValue, suggestions, findProjectById, fallbackProject, t])

  return (
    <InputSelectAutocomplete
      id={id}
      name={name}
      required={required}
      suggestions={suggestions}
      selectedItem={selectedItem}
      statusMessage={statusMessage}
    />
  )
}
