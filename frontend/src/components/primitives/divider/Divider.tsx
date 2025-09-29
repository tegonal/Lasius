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
 * Divider component using DaisyUI classes with CVA for variant management
 * Supports all DaisyUI divider variants and modifiers
 */

const dividerVariants = cva(
  // Base DaisyUI divider class
  'divider',
  {
    variants: {
      orientation: {
        horizontal: 'divider-horizontal',
        vertical: 'divider-vertical',
      },
      color: {
        default: '',
        neutral: 'divider-neutral',
        primary: 'divider-primary',
        secondary: 'divider-secondary',
        accent: 'divider-accent',
        success: 'divider-success',
        warning: 'divider-warning',
        info: 'divider-info',
        error: 'divider-error',
      },
      textAlign: {
        default: '',
        start: 'divider-start',
        end: 'divider-end',
      },
    },
    defaultVariants: {
      color: 'default',
      textAlign: 'default',
    },
  },
)

export interface DividerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof dividerVariants> {
  /**
   * Text content to display in the divider
   * If not provided, renders a plain divider line
   */
  text?: string
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation, color, textAlign, text, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          dividerVariants({
            orientation,
            color,
            textAlign,
          }),
          className,
        )}
        {...props}>
        {text || children}
      </div>
    )
  },
)

Divider.displayName = 'Divider'

// Export variant types for use in other components
export type DividerOrientation = VariantProps<typeof dividerVariants>['orientation']
export type DividerColor = VariantProps<typeof dividerVariants>['color']
export type DividerTextAlign = VariantProps<typeof dividerVariants>['textAlign']
