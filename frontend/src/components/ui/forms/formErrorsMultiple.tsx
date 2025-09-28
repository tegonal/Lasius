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
import { FormError } from 'dynamicTranslationStrings'
import { logger } from 'lib/logger'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { FieldError, FieldErrors, Merge } from 'react-hook-form'

type Props = { errors?: FieldError | Merge<FieldError, FieldErrors<any>> }

export const FormErrorsMultiple: React.FC<Props> = ({ errors = null }) => {
  const { t } = useTranslation('common')
  if (!errors) return null
  const { types = {} } = errors
  logger.warn('[form][FormErrorsMultiple]', errors)
  return (
    <div className="relative top-0 right-0 pb-2">
      <div className="flex max-w-full flex-row flex-wrap items-center justify-end gap-2">
        {Object.keys(types).map((key) => (
          <div key={key} className="badge badge-warning translate-x-[6px] -translate-y-1/2">
            <ErrorSign />
            {
              // @ts-expect-error - error.type is a string
              t(FormError[key])
            }
          </div>
        ))}
      </div>
    </div>
  )
}
