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

import { ErrorSign } from '~/components/ui/feedback/error-sign'

interface FormFieldErrorsProps {
  errors?: string[]
  id?: string
}

export const FormFieldErrors = ({ errors, id }: FormFieldErrorsProps) => {
  if (!errors?.length) return null

  if (errors.length === 1) {
    return (
      <div className="-mt-2" id={id}>
        <div className="badge badge-warning">
          <ErrorSign />
          {errors[0]}
        </div>
      </div>
    )
  }

  return (
    <div className="-mt-2" id={id}>
      <div className="flex max-w-full flex-row flex-wrap items-center justify-end gap-2">
        {errors.map((error) => (
          <div className="badge badge-warning" key={error}>
            <ErrorSign />
            {error}
          </div>
        ))}
      </div>
    </div>
  )
}
