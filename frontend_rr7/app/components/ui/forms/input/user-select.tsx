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
import { type ModelsUserStub } from '~/services/api/lasius'

type UserSelectProps = {
  errors?: string[]
  fallbackUser?: SelectAutocompleteSuggestionType
  id?: string
  name: string
  onChange: (value: string) => void
  /** Pre-fetched list of organisation users */
  users: ModelsUserStub[]
  value: string
}

function useSuggestions(users: ModelsUserStub[]) {
  return useMemo(
    () =>
      [...users]
        .map((user) => ({ id: user.id, key: user.key }))
        .toSorted((a, b) => (a.key ?? '').localeCompare(b.key ?? '')),
    [users],
  )
}

function useUserLookup(
  formValue: string,
  suggestions: SelectAutocompleteSuggestionType[],
  fallbackUser: SelectAutocompleteSuggestionType | undefined,
) {
  const { t } = useTranslation('common')

  return useMemo(() => {
    if (!formValue) {
      return { selectedItem: null, statusMessage: null }
    }

    const item = suggestions.find((u) => u.id === formValue)
    if (item) {
      return { selectedItem: item, statusMessage: null }
    }

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
}

/**
 * Domain-specific wrapper for InputSelectAutocomplete to handle user selection.
 * Controlled component — parent owns the value via useInputControl.
 */
export const UserSelect = ({
  errors,
  fallbackUser,
  id,
  name,
  onChange,
  users,
  value,
}: UserSelectProps) => {
  const suggestions = useSuggestions(users)
  const { selectedItem, statusMessage } = useUserLookup(
    value,
    suggestions,
    fallbackUser,
  )

  return (
    <InputSelectAutocomplete
      errors={errors}
      id={id}
      name={name}
      onChange={onChange}
      selectedItem={selectedItem}
      statusMessage={statusMessage}
      suggestions={suggestions}
      value={value}
    />
  )
}
