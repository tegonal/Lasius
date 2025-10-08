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
import React, { useEffect, useState } from 'react'

type Props = {
  selectedIndex: number
  itemRefs: React.MutableRefObject<(HTMLElement | null)[]>
  className?: string
  radiusOn?: 'top' | 'right' | 'bottom' | 'left' | 'all'
}

export const SlidingIndicator: React.FC<Props> = ({
  selectedIndex,
  itemRefs,
  className,
  radiusOn = 'all',
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, top: 0, width: 0, height: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false)

  const radiusClasses = {
    top: 'rounded-t-md',
    right: 'rounded-r-md',
    bottom: 'rounded-b-md',
    left: 'rounded-l-md',
    all: 'rounded-md',
  }

  useEffect(() => {
    if (selectedIndex !== -1) {
      requestAnimationFrame(() => {
        const element = itemRefs.current[selectedIndex]
        if (element) {
          const rect = element.getBoundingClientRect()
          const containerRect = element.parentElement!.getBoundingClientRect()
          setIndicatorStyle({
            left: rect.left - containerRect.left,
            top: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
          })
          // Mark as positioned and mounted after a short delay to ensure rendering is complete
          if (!isPositioned) {
            setIsPositioned(true)
            requestAnimationFrame(() => {
              setIsMounted(true)
            })
          }
        }
      })
    }
  }, [selectedIndex, itemRefs, isPositioned])

  // Don't render until positioned
  if (!isPositioned) return null

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className={cn(
          'bg-red-gradient absolute transition-all duration-200 ease-out',
          isMounted ? 'opacity-100' : 'opacity-0',
          radiusClasses[radiusOn],
          className,
        )}
        style={{
          left: `${indicatorStyle.left}px`,
          top: `${indicatorStyle.top}px`,
          width: `${indicatorStyle.width}px`,
          height: `${indicatorStyle.height}px`,
          willChange: 'left, top, width, height, opacity',
        }}
      />
    </div>
  )
}
