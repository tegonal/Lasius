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
 * Text component using Tailwind CSS to replace Theme-UI Text during migration
 * Supports all variants from the original theme
 */

const textVariants = cva('', {
  variants: {
    variant: {
      paragraph: 'pb-3 text-base',
      normal: 'pb-3 text-base',
      lead: 'text-lg sm:text-xl',
      footnote: 'text-sm opacity-50',
      small: 'text-sm opacity-50',
      caption: 'pb-3 text-base',
      infoText: 'mb-4 text-base',
      heading:
        'border-base-content/20 mb-2 w-full border-b pt-3 pb-2 text-lg font-normal tracking-wide sm:mb-4',
      headingUnderlined:
        'border-base-content/20 text-base-content mb-3 flex w-full flex-row items-center justify-between border-b pb-2 text-base',
      headingUnderlinedMuted:
        'border-base-content/20 text-base-content/50 mb-4 w-full border-b text-sm',
      headingTableHeader: 'mb-1 text-sm font-normal',
      label: 'mb-2 text-sm',
      footer: 'text-base-content/75 text-center text-sm leading-tight',
    },
  },
  defaultVariants: {
    variant: 'normal',
  },
})

type TextElement = 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label'

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'as'>,
    VariantProps<typeof textVariants> {
  children: React.ReactNode
  as?: TextElement
}

export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, variant, children, as: Component = 'span', ...props }, ref) => {
    // Special handling for footer variant links
    const footerLinkStyles =
      variant === 'footer' ? '[&_a]:text-base-content/75 [&_a:hover]:no-underline' : ''

    // Special handling for default anchor styles in other variants
    const anchorStyles =
      variant !== 'footer'
        ? '[&_a]:text-base-content [&_a:hover]:text-base-content [&_a:hover]:no-underline [&_a:visited]:text-base-content'
        : ''

    const combinedClassName = cn(
      textVariants({ variant }),
      footerLinkStyles,
      anchorStyles,
      className,
    )

    return React.createElement(
      Component,
      {
        ref: ref as any,
        className: combinedClassName,
        ...props,
      },
      children,
    )
  },
)

Text.displayName = 'Text'

// Export variant types for use in other components
export type TextVariant = VariantProps<typeof textVariants>['variant']
