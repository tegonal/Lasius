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

import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'lib/utils/cn'
import React from 'react'

/**
 * Floating Action Button (FAB) primitive using DaisyUI 5.x
 *
 * Based on DaisyUI FAB/Speed Dial component documentation:
 * https://daisyui.com/components/fab/
 *
 * Features:
 * - Vertical or flower (quarter-circle) layout
 * - Accessible (role="button", tabindex="0")
 * - Supports multiple secondary actions
 */

const fabVariants = cva('fab', {
  variants: {
    layout: {
      vertical: '', // Default vertical stacking
      flower: 'fab-flower', // Quarter-circle arrangement
    },
    position: {
      bottomRight: 'fixed right-4 bottom-4',
      bottomLeft: 'fixed bottom-4 left-4',
      bottomCenter: 'fixed bottom-4 left-1/2 -translate-x-1/2',
      topRight: 'fixed top-4 right-4',
      topLeft: 'fixed top-4 left-4',
    },
  },
  defaultVariants: {
    layout: 'vertical',
    position: 'bottomRight',
  },
})

export interface FABAction {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  ariaLabel?: string
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'ghost'
}

export interface FloatingActionButtonProps extends VariantProps<typeof fabVariants> {
  /** The main FAB icon */
  icon: React.ReactNode
  /** Array of secondary action buttons */
  actions: FABAction[]
  /** Optional main button aria label */
  ariaLabel?: string
  /** Optional close icon (shown when expanded) */
  closeIcon?: React.ReactNode
  /** Optional class name for additional styling */
  className?: string
  /** Size of the main button */
  size?: 'sm' | 'md' | 'lg'
  /** z-index value (default: 10) */
  zIndex?: number
}

/**
 * FloatingActionButton component
 *
 * Renders a fixed-position FAB that expands to show secondary actions.
 * Uses native DaisyUI FAB classes with proper accessibility.
 *
 * Note: Safari has a CSS bug preventing button elements from being focused,
 * so we use div with tabindex="0" and role="button" as a workaround.
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  actions,
  ariaLabel = 'Open actions menu',
  closeIcon,
  layout = 'vertical',
  position = 'bottomRight',
  className,
  size = 'lg',
  zIndex = 10,
}) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : 'btn-md'

  return (
    <div className={cn(fabVariants({ layout, position }), className)} style={{ zIndex }}>
      {/* Primary FAB button - uses div for Safari accessibility bug */}
      <div
        tabIndex={0}
        role="button"
        aria-label={ariaLabel}
        className={cn(
          'btn btn-circle',
          sizeClass,
          'bg-primary-gradient hover:bg-primary-gradient-hover border-none text-white',
        )}>
        {icon}
      </div>

      {/* Optional close button or main action replacement */}
      {closeIcon && (
        <div className="fab-close">
          <button
            className={cn('btn btn-circle', sizeClass, 'btn-ghost')}
            aria-label="Close actions menu">
            {closeIcon}
          </button>
        </div>
      )}

      {/* Secondary action buttons */}
      {actions.map((action) => {
        const variantClass = action.variant
          ? action.variant === 'primary'
            ? 'bg-primary-gradient hover:bg-primary-gradient-hover border-none text-white'
            : action.variant === 'secondary'
              ? 'bg-neutral-gradient hover:bg-neutral-gradient-hover border-none text-white'
              : `btn-${action.variant}`
          : 'bg-primary-gradient hover:bg-primary-gradient-hover border-none text-white'

        return (
          <button
            key={action.id}
            onClick={action.onClick}
            aria-label={action.ariaLabel || action.label}
            className={cn('btn btn-circle', sizeClass, variantClass)}
            title={action.label}>
            {action.icon}
          </button>
        )
      })}
    </div>
  )
}

FloatingActionButton.displayName = 'FloatingActionButton'
