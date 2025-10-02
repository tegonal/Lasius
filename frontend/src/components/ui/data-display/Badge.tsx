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

const badgeVariants = cva('badge inline-flex items-center gap-2', {
  variants: {
    variant: {
      primary: 'badge-primary',
      secondary: 'badge-secondary',
      muted: 'bg-base-100 text-base-content',
      tag: 'bg-accent text-accent-content overflow-visible whitespace-nowrap',
      tagSimpleTag: 'bg-accent text-accent-content whitespace-nowrap',
      tagTagGroup: 'bg-primary text-primary-content whitespace-nowrap',
      tagWithSummary: 'bg-secondary text-secondary-content',
      warning: 'bg-warning text-warning-content',
      outline: 'border-base-content text-base-content border bg-transparent',
      tooltip: 'badge-neutral h-auto w-auto max-w-[45ch] whitespace-pre-wrap text-white',
    },
    clickable: {
      true: 'cursor-pointer transition-colors',
      false: '',
    },
  },
  compoundVariants: [
    {
      variant: 'tagSimpleTag',
      clickable: true,
      class: 'hover:bg-neutral hover:text-neutral-content',
    },
    {
      variant: 'tagTagGroup',
      clickable: true,
      class: 'hover:bg-neutral hover:text-neutral-content',
    },
    {
      variant: 'tagWithSummary',
      clickable: true,
      class: 'hover:bg-neutral hover:text-neutral-content',
    },
  ],
  defaultVariants: {
    variant: 'primary',
    clickable: false,
  },
})

export interface Props extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode
  className?: string
  onClick?: React.MouseEventHandler<HTMLDivElement>
}

export const Badge: React.FC<Props> = ({ children, variant, clickable, className, onClick }) => {
  return (
    <div className={cn(badgeVariants({ variant, clickable }), className)} onClick={onClick}>
      {children}
    </div>
  )
}
