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
import React from 'react'

import { cn } from '~/lib/utils/cn'

const textVariants = cva('', {
  defaultVariants: {
    variant: 'normal',
  },
  variants: {
    variant: {
      caption: 'pb-3 text-base',
      footer: 'text-base-content/75 text-center text-sm leading-tight',
      footnote: 'text-sm opacity-50',
      heading:
        'border-base-content/20 mb-2 w-full border-b pt-3 pb-2 text-lg font-normal tracking-wide sm:mb-4',
      headingTableHeader: 'mb-1 text-sm font-normal',
      headingUnderlined:
        'border-base-content/20 text-base-content mb-3 flex w-full flex-row items-center justify-between border-b pb-2 text-base',
      headingUnderlinedMuted:
        'border-base-content/20 text-base-content/50 mb-4 w-full border-b text-sm',
      infoText: 'mb-4 text-base',
      label: 'mb-2 text-sm',
      lead: 'text-lg sm:text-xl',
      normal: 'pb-3 text-base',
      paragraph: 'pb-3 text-base',
      small: 'text-sm opacity-50',
    },
  },
})

export interface TextProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'as'>,
    VariantProps<typeof textVariants> {
  as?: TextElement
  children: React.ReactNode
}

type TextElement =
  | 'div'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'label'
  | 'p'
  | 'span'

export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ as: Component = 'p', children, className, variant, ...props }, ref) => {
    const footerLinkStyles =
      variant === 'footer'
        ? '[&_a]:text-base-content/75 [&_a:hover]:no-underline'
        : ''

    const anchorStyles =
      variant === 'footer'
        ? ''
        : '[&_a]:text-base-content [&_a:hover]:text-base-content [&_a:hover]:no-underline [&_a:visited]:text-base-content'

    const combinedClassName = cn(
      textVariants({ variant }),
      footerLinkStyles,
      anchorStyles,
      className,
    )

    return React.createElement(
      Component,
      {
        className: combinedClassName,
        ref: ref as React.Ref<HTMLElement>,
        ...props,
      },
      children,
    )
  },
)

Text.displayName = 'Text'

export type TextVariant = VariantProps<typeof textVariants>['variant']
