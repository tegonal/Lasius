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
  sx?: any
  className?: string
}

export const DropdownList: React.FC<Props> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'bg-base-100 border-base-content/20 absolute mt-1 rounded-lg border',
        'h-auto max-h-[240px] w-full overflow-auto py-1',
        'z-50 shadow-lg',
        'scrollbar-thin scrollbar-thumb-base-content/20 scrollbar-track-transparent',
        className,
      )}>
      {children}
    </div>
  )
}
