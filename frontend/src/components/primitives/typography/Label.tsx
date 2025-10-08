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
 * Label component using DaisyUI classes with Tailwind CSS
 * This component replaces Theme-UI Label during migration
 */

const labelVariants = cva(
  // Base DaisyUI label class
  'label cursor-pointer',
  {
    variants: {
      variant: {
        default: 'label-text',
        primary: 'label-text text-primary',
        secondary: 'label-text text-secondary',
        accent: 'label-text text-accent',
        muted: 'label-text text-neutral/70',
        error: 'label-text text-error',
        warning: 'label-text text-warning',
        info: 'label-text text-info',
        success: 'label-text text-success',
      },
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
      weight: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
      },
      required: {
        true: "after:text-error after:ml-0.5 after:content-['*']",
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      weight: 'medium',
      required: false,
    },
  },
)

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  children: React.ReactNode
  as?: 'label' | 'span'
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (
    { className, variant, size, weight, required, children, as: Component = 'label', ...props },
    ref,
  ) => {
    const Element = Component as any

    return (
      <Element
        ref={ref}
        className={cn(
          labelVariants({
            variant,
            size,
            weight,
            required,
          }),
          className,
        )}
        {...props}>
        {children}
      </Element>
    )
  },
)

Label.displayName = 'Label'

// Export the variant types for use in other components
export type LabelVariant = VariantProps<typeof labelVariants>['variant']
export type LabelSize = VariantProps<typeof labelVariants>['size']
export type LabelWeight = VariantProps<typeof labelVariants>['weight']
