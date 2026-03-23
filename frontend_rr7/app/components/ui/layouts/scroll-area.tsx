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

import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area'
import { type ReactNode } from 'react'

import { cn } from '~/lib/utils/cn'

export const ScrollArea = ({
  children,
  className,
  onScroll,
}: {
  children: ReactNode
  className?: string
  onScroll?: React.UIEventHandler<HTMLDivElement>
}) => {
  return (
    <BaseScrollArea.Root className={cn('min-h-0', className)}>
      <BaseScrollArea.Viewport
        className="h-full overscroll-contain"
        onScroll={onScroll}
      >
        <BaseScrollArea.Content>{children}</BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar className="pointer-events-none m-0.5 flex w-1 justify-center rounded-sm opacity-0 transition-opacity data-[hovering]:pointer-events-auto data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[scrolling]:pointer-events-auto data-[scrolling]:opacity-100 data-[scrolling]:duration-0">
        <BaseScrollArea.Thumb className="bg-base-content/20 w-full rounded-sm" />
      </BaseScrollArea.Scrollbar>
    </BaseScrollArea.Root>
  )
}
