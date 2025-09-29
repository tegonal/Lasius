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

import { cn } from 'lib/utils/cn'
import React from 'react'

type Props = {
  children: React.ReactNode
  className?: string
}

/**
 * Container for form action buttons (submit, cancel, etc.)
 * Should be placed as the last FormElement in a form
 */
export const ButtonGroup: React.FC<Props> = ({ children, className }) => {
  return <div className={cn('fieldset mt-2 gap-4 p-2', className)}>{children}</div>
}
