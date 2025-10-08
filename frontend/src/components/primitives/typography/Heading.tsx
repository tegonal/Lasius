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

const headingVariants = cva('', {
  variants: {
    variant: {
      h1: 'text-4xl font-bold tracking-wide',
      h2: 'text-3xl font-bold tracking-wide',
      h3: 'text-2xl font-semibold tracking-wide',
      h4: 'text-xl font-semibold',
      h5: 'text-lg font-medium',
      h6: 'text-base font-medium',
      display: 'text-5xl font-bold tracking-wider',
      title: 'text-2xl font-bold tracking-wide',
      subtitle: 'text-base-content/70 text-lg font-medium',
      section:
        'border-base-content/20 mb-2 w-full border-b pt-3 pb-2 text-lg font-normal tracking-wide sm:mb-4',
      page: 'mb-4 text-3xl font-bold',
      headingTableHeader: 'mb-1 text-sm font-normal',
      headingUnderlinedMuted:
        'border-base-content/30 text-base-content/70 mb-4 w-full border-b text-sm font-normal',
    },
    size: {
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    },
    tone: {
      default: '',
      primary: 'text-primary',
      secondary: 'text-secondary',
      accent: 'text-accent',
      muted: 'text-base-content/70',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-error',
      info: 'text-info',
    },
  },
  defaultVariants: {
    variant: 'h2',
    align: 'left',
    tone: 'default',
  },
})

type HeadingElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: HeadingElement
  children: React.ReactNode
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, variant, size, align, tone, as = 'h2', children, ...props }, ref) => {
    const Component = as

    return (
      <Component
        ref={ref}
        className={cn(headingVariants({ variant, size, align, tone }), className)}
        {...props}>
        {children}
      </Component>
    )
  },
)

Heading.displayName = 'Heading'

// Export variant types for use in other components
export type HeadingVariant = VariantProps<typeof headingVariants>['variant']
export type HeadingSize = VariantProps<typeof headingVariants>['size']
export type HeadingAlign = VariantProps<typeof headingVariants>['align']
export type HeadingTone = VariantProps<typeof headingVariants>['tone']
