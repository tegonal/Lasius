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
import React from 'react'
import { FieldError, FieldErrors, Merge } from 'react-hook-form'

type Props = {
  error?: FieldError | Merge<FieldError, FieldErrors<any>>
  id?: string
}

export const FormErrorBadge: React.FC<Props> = ({ error, id }) => {
  if (!error) return null
  logger.info('[form][FormErrorBadge]', error.type)

  return (
    <div className="-mt-2" id={id}>
      <div className="badge badge-warning">
        <ErrorSign />
        {error.message ||
          // @ts-expect-error - error.type is a string
          FormError[error.type]}
      </div>
    </div>
  )
}
