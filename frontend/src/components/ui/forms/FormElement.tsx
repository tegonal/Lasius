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

import { Label } from 'components/primitives/typography/Label'
import React from 'react'

type Props = {
  children: React.ReactNode
  label?: string
  htmlFor?: string
  required?: boolean
  labelActionSlot?: React.ReactNode
}

export const FormElement: React.FC<Props> = ({
  children,
  label,
  htmlFor,
  required,
  labelActionSlot,
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <div className="relative flex items-center">
          <Label htmlFor={htmlFor} required={required}>
            {label}
          </Label>
          {labelActionSlot && (
            <div className="absolute top-0 right-0 flex items-center">{labelActionSlot}</div>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
