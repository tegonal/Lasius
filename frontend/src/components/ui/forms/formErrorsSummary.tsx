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

type Props = { errors: { [x: string]: { types: { [x: string]: boolean } } } }

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

export const FormErrorsSummary: React.FC<Props> = ({ errors }) => {
  const { t } = useTranslation('common')
  logger.warn('[form][FormErrorsSummary]', errors)
  return (
    <>
      {Object.keys(errors).map((field) => (
        <div
          key={field}
          className="flex max-w-full flex-row flex-wrap items-center justify-start gap-2 py-2">
          {Object.keys(errors[field].types).map((key) => {
            const translationKey = errorTypeToTranslationKey[key]
            return (
              <div key={key} className="badge badge-warning">
                <ErrorSign />
                {translationKey ? t(translationKey as any) : key}
              </div>
            )
          })}
        </div>
      ))}
    </>
  )
}
