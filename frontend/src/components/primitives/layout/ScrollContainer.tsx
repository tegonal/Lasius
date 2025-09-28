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

import { noop } from 'es-toolkit'
import { cn } from 'lib/utils/cn'
import React from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  onScroll?: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void
}

/**
 * A container that can be scrolled vertically. Must be part of a grid.
 * @param children
 * @param className
 * @param onScroll
 */
export const ScrollContainer: React.FC<Props> = ({ children, className, onScroll = noop }) => {
  return (
    <div
      className={cn(
        'relative h-full overflow-x-hidden overflow-y-auto scroll-smooth',
        'scrollbar-thin scrollbar-thumb-base-content/20 scrollbar-track-transparent',
        className,
      )}
      onScroll={onScroll}>
      {children}
    </div>
  )
}
