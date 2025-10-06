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
import { useUsers } from 'lib/api/hooks/useUsers'
import { useTranslation } from 'next-i18next'
import React, { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  InputSelectAutocomplete,
  SelectAutocompleteSuggestionType,
} from './InputSelectAutocomplete'

type Props = {
  name: string
  organisationId: string
  required?: boolean
  id?: string
  fallbackUser?: SelectAutocompleteSuggestionType
}

/**
 * Domain-specific wrapper for InputSelectAutocomplete to handle user selection
 * Handles finding users in active list, inactive users, and fallback users
 */
export const UserSelect: React.FC<Props> = ({
  name,
  organisationId,
  required,
  id,
  fallbackUser,
}) => {
  const { t } = useTranslation('common')
  const { userSuggestions, findUserById } = useUsers(organisationId)
  const formContext = useFormContext()

  const suggestions = userSuggestions()
  const formValue = formContext?.watch(name)

  const { selectedItem, statusMessage } = useMemo(() => {
    if (!formValue) {
      return { selectedItem: null, statusMessage: null }
    }

    // First try to find in suggestions (active users)
    let item = find(suggestions, { id: formValue })
    if (item) {
      return { selectedItem: item, statusMessage: null }
    }

    // If not found in suggestions, try to find it (inactive users)
    item = findUserById(formValue)
    if (item) {
      return {
        selectedItem: item,
        statusMessage: {
          text: t('users.warnings.userNotInActiveList', {
            defaultValue:
              'This user is not in your active users list. They may have been removed from the organisation.',
          }),
          variant: 'info' as const,
        },
      }
    }

    // If still not found, use fallbackUser if it matches the formValue (user from booking, not in organisation)
    if (fallbackUser && fallbackUser.id === formValue) {
      return {
        selectedItem: fallbackUser,
        statusMessage: {
          text: t('users.warnings.userUnavailable', {
            defaultValue: 'This user is no longer available in your organisation.',
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
          defaultValue: 'This user could not be found. The user ID is shown above.',
        }),
        variant: 'error' as const,
      },
    }
  }, [formValue, suggestions, findUserById, fallbackUser, t])

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
