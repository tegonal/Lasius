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

import { Button } from 'components/primitives/buttons/Button'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { ChevronDown, ChevronUp } from 'lucide-react'
import React, { useRef, useState } from 'react'

interface SegmentedInputWrapperProps {
  children: React.ReactElement
  onArrowClick: (direction: 'up' | 'down') => void
  hasSelection: boolean
  label?: string
}

export const SegmentedInputWrapper: React.FC<SegmentedInputWrapperProps> = ({
  children,
  onArrowClick,
  hasSelection,
  label,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      {/* Up Arrow - positioned above input */}
      <div
        className={`absolute -top-6 right-0 left-0 flex justify-center transition-opacity ${
          hasSelection || isHovered
            ? 'opacity-60 hover:opacity-100'
            : 'pointer-events-none opacity-0'
        }`}>
        <Button
          type="button"
          variant="neutral"
          size="xs"
          className="cursor-pointer rounded-t-full rounded-b-none"
          onMouseDown={(e) => {
            e.preventDefault() // Prevent focus loss
            onArrowClick('up')
          }}
          tabIndex={-1}
          aria-label="Increment">
          <LucideIcon icon={ChevronUp} size={24} />
        </Button>
      </div>
      <div className="join">{children}</div>
      {/* Down Arrow - positioned below input */}
      <div
        className={`absolute right-0 -bottom-10 left-0 flex flex-col items-center ${
          hasSelection || isHovered ? '' : 'pointer-events-none'
        }`}>
        <Button
          type="button"
          variant="neutral"
          size="xs"
          className={`cursor-pointer rounded-t-none rounded-b-full transition-opacity ${
            hasSelection || isHovered ? 'opacity-60 hover:opacity-100' : 'opacity-0'
          }`}
          onMouseDown={(e) => {
            e.preventDefault() // Prevent focus loss
            onArrowClick('down')
          }}
          tabIndex={-1}
          aria-label="Decrement">
          <LucideIcon icon={ChevronDown} size={24} />
        </Button>
        {label && (
          <span
            className={`text-base-content/60 mt-1 text-xs whitespace-nowrap transition-opacity ${
              hasSelection || isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
