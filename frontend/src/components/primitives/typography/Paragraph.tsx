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

import { cva } from 'class-variance-authority'
import { cn } from 'lib/utils/cn'
import React, { memo } from 'react'

const paragraphVariants = cva(
  'first:mt-0 last:mb-0 [h1+&]:mt-0 [h2+&]:mt-0 [h3+&]:mt-0 [h4+&]:mt-0',
  {
    variants: {
      variant: {
        paragraph: '',
      },
    },
    defaultVariants: {
      variant: 'paragraph',
    },
  },
)

type Props = {
  variant?: 'paragraph'
  children?: React.ReactNode
  className?: string
}

export const P: React.FC<Props> = memo((props) => {
  const { variant = 'paragraph', children, className } = props
  return <p className={cn(paragraphVariants({ variant }), className)}>{children}</p>
})
