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
  error?: FieldError | Merge<FieldError, FieldErrors<any>>
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
}

export const FormErrorBadge: React.FC<Props> = ({ error, id }) => {
  const { t } = useTranslation('common')

  if (!error) return null
  logger.info('[form][FormErrorBadge]', error.type)

  const getErrorMessage = () => {
    if (error.message) return error.message

    const errorType = String(error.type || '')
    const translationKey = errorTypeToTranslationKey[errorType]
    if (translationKey) {
      return t(translationKey as any)
    }

    // Fallback to error type if no translation found
    return errorType
  }

  return (
    <div className="-mt-2" id={id}>
      <div className="badge badge-warning">
        <ErrorSign />
        {getErrorMessage()}
      </div>
    </div>
  )
}
