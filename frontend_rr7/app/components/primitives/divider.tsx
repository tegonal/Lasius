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
import { forwardRef, type HTMLAttributes } from 'react'

import { cn } from '~/lib/utils/cn'

const dividerVariants = cva('divider', {
  defaultVariants: {
    color: 'default',
    textAlign: 'default',
  },
  variants: {
    color: {
      accent: 'divider-accent',
      default: '',
      error: 'divider-error',
      info: 'divider-info',
      neutral: 'divider-neutral',
      primary: 'divider-primary',
      secondary: 'divider-secondary',
      success: 'divider-success',
      warning: 'divider-warning',
    },
    orientation: {
      horizontal: 'divider-horizontal',
      vertical: 'divider-vertical',
    },
    textAlign: {
      default: '',
      end: 'divider-end',
      start: 'divider-start',
    },
  },
})

export interface DividerProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof dividerVariants> {
  text?: string
}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  (
    { children, className, color, orientation, text, textAlign, ...props },
    ref,
  ) => {
    return (
      <div
        className={cn(
          dividerVariants({ color, orientation, textAlign }),
          className,
        )}
        ref={ref}
        {...props}
      >
        {text || children}
      </div>
    )
  },
)

Divider.displayName = 'Divider'
