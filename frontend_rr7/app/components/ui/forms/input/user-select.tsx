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
import { type ModelsUserStub } from '~/services/api/lasius'

type UserSelectProps = {
  fallbackUser?: SelectAutocompleteSuggestionType
  id?: string
  name: string
  required?: boolean
  /** Pre-fetched list of organisation users */
  users: ModelsUserStub[]
}

/**
 * Domain-specific wrapper for InputSelectAutocomplete to handle user selection.
 * Handles finding users in active list and fallback users.
 */
export const UserSelect = ({
  fallbackUser,
  id,
  name,
  required,
  users,
}: UserSelectProps) => {
  const { t } = useTranslation('common')
  const formContext = useFormContext()

  const formValue = formContext?.watch(name)

  const suggestions: SelectAutocompleteSuggestionType[] = useMemo(
    () =>
      [...users]
        .map((user) => ({
          id: user.id,
          key: user.key,
        }))
        .sort((a, b) => (a.key ?? '').localeCompare(b.key ?? '')),
    [users],
  )

  const { selectedItem, statusMessage } = useMemo(() => {
    if (!formValue) {
      return { selectedItem: null, statusMessage: null }
    }

    // First try to find in suggestions (active users)
    const item = suggestions.find((u) => u.id === formValue)
    if (item) {
      return { selectedItem: item, statusMessage: null }
    }

    // If not found, use fallbackUser if it matches the formValue
    if (fallbackUser && fallbackUser.id === formValue) {
      return {
        selectedItem: fallbackUser,
        statusMessage: {
          text: t('users.warnings.userUnavailable', {
            defaultValue:
              'This user is no longer available in your organisation.',
          }),
          variant: 'warning' as const,
        },
      }
    }

    // User not found anywhere
    return {
      selectedItem: null,
      statusMessage: {
        text: t('users.errors.userNotFound', {
          defaultValue:
            'This user could not be found. The user ID is shown above.',
        }),
        variant: 'error' as const,
      },
    }
  }, [formValue, suggestions, fallbackUser, t])

  return (
    <InputSelectAutocomplete
      id={id}
      name={name}
      required={required}
      selectedItem={selectedItem}
      statusMessage={statusMessage}
      suggestions={suggestions}
    />
  )
}
