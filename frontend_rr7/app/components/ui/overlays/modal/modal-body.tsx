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

import { type ReactNode, useEffect, useRef, useState } from 'react'

import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { cn } from '~/lib/utils/cn'

/**
 * Scrollable body area for modals. Uses a ResizeObserver to measure
 * available space and sets an explicit pixel height on the ScrollArea,
 * giving Base UI's Viewport a definite height for scroll + scrollbar.
 *
 * Usage:
 * <Modal onClose={onClose} open={open}>
 *   <ModalCloseButton onClose={onClose} />
 *   <ModalHeader>Title</ModalHeader>
 *   <ModalBody>
 *     {scrollable content}
 *   </ModalBody>
 *   <ButtonGroup>{footer}</ButtonGroup>
 * </Modal>
 */
export const ModalBody = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => {
  const [height, setHeight] = useState<number | undefined>()
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setHeight(entry.contentRect.height)
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className={cn('min-h-0 flex-1', className)} ref={wrapperRef}>
      <ScrollArea style={height ? { height } : undefined}>
        {children}
      </ScrollArea>
    </div>
  )
}
