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

import { ChevronDown, ChevronUp } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'

import { getArrowVisibilityClasses } from './segmented-input-classes'

type SegmentedInputWrapperProperties = {
  children: React.ReactElement
  hasSelection: boolean
  label?: string
  onArrowClick: (direction: 'down' | 'up') => void
}

export const SegmentedInputWrapper = ({
  children,
  hasSelection,
  label,
  onArrowClick,
}: SegmentedInputWrapperProperties) => {
  const { t } = useTranslation('common')
  const [isHovered, setIsHovered] = useState(false)
  const containerReference = useRef<HTMLDivElement>(null)
  const classes = getArrowVisibilityClasses(hasSelection || isHovered)

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={containerReference}>
      {/* Up Arrow - positioned above input */}
      <div
        className={`absolute -top-6 right-0 left-0 flex justify-center transition-opacity ${classes.up}`}>
        <Button
          aria-label={t('aria.increment', 'Increment')}
          className="cursor-pointer rounded-t-full rounded-b-none"
          onMouseDown={(event) => {
            event.preventDefault()
            onArrowClick('up')
          }}
          size="xs"
          tabIndex={-1}
          type="button"
          variant="neutral">
          <LucideIcon icon={ChevronUp} size={24} />
        </Button>
      </div>
      <div className="join">{children}</div>
      {/* Down Arrow - positioned below input */}
      <div
        className={`absolute right-0 -bottom-10 left-0 flex flex-col items-center ${classes.downContainer}`}>
        <Button
          aria-label={t('aria.decrement', 'Decrement')}
          className={`cursor-pointer rounded-t-none rounded-b-full transition-opacity ${classes.downButton}`}
          onMouseDown={(event) => {
            event.preventDefault()
            onArrowClick('down')
          }}
          size="xs"
          tabIndex={-1}
          type="button"
          variant="neutral">
          <LucideIcon icon={ChevronDown} size={24} />
        </Button>
        {label && (
          <span
            className={`text-base-content/60 mt-1 text-xs whitespace-nowrap transition-opacity ${classes.label}`}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
