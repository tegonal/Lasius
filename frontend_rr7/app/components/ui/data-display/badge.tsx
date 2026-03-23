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

const badgeVariants = cva(
  'badge inline-flex items-center gap-2 rounded-sm px-2',
  {
    compoundVariants: [
      {
        class: 'hover:bg-neutral hover:text-neutral-content',
        clickable: true,
        variant: 'tagSimpleTag',
      },
      {
        class: 'hover:bg-neutral hover:text-neutral-content',
        clickable: true,
        variant: 'tagTagGroup',
      },
      {
        class: 'hover:bg-neutral hover:text-neutral-content',
        clickable: true,
        variant: 'tagWithSummary',
      },
    ],
    defaultVariants: {
      clickable: false,
      variant: 'primary',
    },
    variants: {
      clickable: {
        false: 'select-none',
        true: 'cursor-pointer transition-colors',
      },
      variant: {
        muted: 'bg-base-100 text-base-content',
        outline: 'border-base-content text-base-content border bg-transparent',
        primary: 'badge-primary',
        secondary: 'badge-secondary',
        tag: 'bg-accent text-accent-content overflow-visible whitespace-nowrap',
        tagSimpleTag: 'bg-accent text-accent-content whitespace-nowrap',
        tagTagGroup: 'bg-primary text-primary-content whitespace-nowrap',
        tagWithSummary: 'bg-secondary text-secondary-content',
        tooltip:
          'badge-neutral h-auto w-auto max-w-[45ch] whitespace-pre-wrap text-white',
        warning: 'bg-warning text-warning-content',
      },
    },
  },
)

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    children?: React.ReactNode
  }

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, className, clickable, variant, ...props }, ref) => {
    return (
      <span
        className={cn(badgeVariants({ clickable, variant }), className)}
        ref={ref}
        {...props}
      >
        {children}
      </span>
    )
  },
)

Badge.displayName = 'Badge'

export { Badge, badgeVariants }
export type { BadgeProps }
