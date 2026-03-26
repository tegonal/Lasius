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
import { type ReactNode, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '~/lib/utils/cn'

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
  defaultVariants: {
    layout: 'vertical',
    position: 'bottomRight',
  },
  variants: {
    layout: {
      flower: 'fab-flower',
      vertical: '',
    },
    position: {
      bottomCenter: 'fixed bottom-4 left-1/2 -translate-x-1/2',
      bottomLeft: 'fixed bottom-4 left-4',
      bottomRight: 'fixed right-4 bottom-4',
      topLeft: 'fixed top-4 left-4',
      topRight: 'fixed top-4 right-4',
    },
  },
})

export interface FABAction {
  ariaLabel?: string
  icon: ReactNode
  id: string
  label: string
  onClick: () => void
  variant?: 'accent' | 'ghost' | 'neutral' | 'primary' | 'secondary'
}

interface FloatingActionButtonProps extends VariantProps<typeof fabVariants> {
  actions: FABAction[]
  ariaLabel?: string
  className?: string
  closeIcon?: ReactNode
  icon: ReactNode
  size?: 'lg' | 'md' | 'sm'
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
export const FloatingActionButton = ({
  actions,
  ariaLabel,
  className,
  closeIcon,
  icon,
  layout = 'vertical',
  position = 'bottomRight',
  size = 'lg',
  zIndex = 10,
}: FloatingActionButtonProps) => {
  const { t } = useTranslation('common')
  const containerRef = useRef<HTMLDivElement>(null)
  const resolvedAriaLabel =
    ariaLabel ??
    t('common.actions.openActionsMenu', { defaultValue: 'Open actions menu' })
  const sizeClass =
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : 'btn-md'

  const handleClose = () => {
    // DaisyUI FAB uses :focus-within to show/hide actions.
    // Blur the container to close the menu.
    containerRef.current?.blur()
    ;(document.activeElement as HTMLElement)?.blur()
  }

  return (
    <div
      className={cn(fabVariants({ layout, position }), className)}
      ref={containerRef}
      style={{ zIndex }}
    >
      {/* Primary FAB button - uses div for Safari accessibility bug */}
      <div
        aria-label={resolvedAriaLabel}
        className={cn(
          'btn btn-circle',
          sizeClass,
          'bg-primary-gradient hover:bg-primary-gradient-hover border-none text-white',
        )}
        role="button"
        tabIndex={0}
      >
        {icon}
      </div>

      {/* Optional close button or main action replacement */}
      {closeIcon && (
        <div className="fab-close">
          <button
            aria-label={t('common.actions.closeActionsMenu', {
              defaultValue: 'Close actions menu',
            })}
            className={cn('btn btn-circle', sizeClass, 'btn-ghost')}
            onClick={handleClose}
          >
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
            aria-label={action.ariaLabel || action.label}
            className={cn('btn btn-circle', sizeClass, variantClass)}
            key={action.id}
            onClick={action.onClick}
            title={action.label}
          >
            {action.icon}
          </button>
        )
      })}
    </div>
  )
}
