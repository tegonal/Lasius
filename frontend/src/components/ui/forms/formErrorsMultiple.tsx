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

import { ErrorSign } from 'components/ui/feedback/ErrorSign'
import { logger } from 'lib/logger'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { FieldError, FieldErrors, Merge } from 'react-hook-form'

type Props = {
  errors?: FieldError | Merge<FieldError, FieldErrors<any>>
  id?: string
}

const errorTypeToTranslationKey: Record<string, string> = {
  required: 'common.validation.required',
  pattern: 'common.validation.wrongFormat',
  isEmailAddress: 'common.validation.emailInvalid',
  notEnoughCharactersPassword: 'common.validation.passwordTooShort',
  noUppercase: 'common.validation.missingUppercase',
  noSpecialCharacters: 'common.validation.missingSpecialChar',
  notEqualPassword: 'common.validation.passwordMismatch',
  startInPast: 'common.validation.mustBeInPast',
  endAfterStart: 'common.validation.mustBeAfterStart',
  startBeforeEnd: 'common.validation.mustBeBeforeEnd',
  noNumber: 'common.validation.missingNumber',
  toAfterFrom: 'common.validation.toMustBeAfterFrom',
  fromBeforeTo: 'common.validation.fromMustBeBeforeTo',
  // Map Zod error codes to translation keys (fallbacks, prefer message over type)
  too_small: 'common.validation.passwordTooShort',
  invalid_string: 'common.validation.wrongFormat',
  invalid_format: 'common.validation.wrongFormat',
  // custom: don't map, will use the message directly
}

export const FormErrorsMultiple: React.FC<Props> = ({ errors = null, id }) => {
  const { t } = useTranslation('common')
  if (!errors) return null
  const { types, message } = errors
  logger.warn('[form][FormErrorsMultiple]', errors)

  // If no types but has a message, create a single error display
  if (!types && message) {
    return (
      <div className="relative top-0 right-0 pb-2" id={id}>
        <div className="flex max-w-full flex-row flex-wrap items-center justify-end gap-2">
          <div className="badge badge-warning translate-x-[6px] -translate-y-1/2">
            <ErrorSign />
            {typeof message === 'string' ? message : ''}
          </div>
        </div>
      </div>
    )
  }

  if (!types) return null

  return (
    <div className="relative top-0 right-0 pb-2" id={id}>
      <div className="flex max-w-full flex-row flex-wrap items-center justify-end gap-2">
        {Object.keys(types).map((key) => {
          const errorValue = types[key as keyof typeof types]
          const translationKey = errorTypeToTranslationKey[key]

          // Handle arrays of error messages (e.g., from Zod custom validation)
          if (Array.isArray(errorValue)) {
            return errorValue.map((msg, index) => (
              <div
                key={`${key}-${index}`}
                className="badge badge-warning translate-x-[6px] -translate-y-1/2">
                <ErrorSign />
                {typeof msg === 'string' ? msg : String(msg)}
              </div>
            ))
          }

          // Priority: 1) error message string, 2) message property, 3) translation, 4) error type key
          let displayMessage: string
          if (typeof errorValue === 'string') {
            displayMessage = errorValue
          } else if (typeof errorValue === 'object' && errorValue && 'message' in errorValue) {
            displayMessage = String(errorValue.message)
          } else if (translationKey) {
            displayMessage = t(translationKey as any)
          } else {
            displayMessage = key
          }

          return (
            <div key={key} className="badge badge-warning translate-x-[6px] -translate-y-1/2">
              <ErrorSign />
              {displayMessage}
            </div>
          )
        })}
      </div>
    </div>
  )
}
