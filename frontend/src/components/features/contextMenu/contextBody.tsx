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

const contextBodyVariants = cva('flex items-center', {
  variants: {
    variant: {
      default: '',
      compact: 'relative h-full justify-center',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

type Props = {
  children: React.ReactNode
} & VariantProps<typeof contextBodyVariants>

export const ContextBody: React.FC<Props> = ({ children, variant = 'default' }) => {
  return <div className={cn(contextBodyVariants({ variant }))}>{children}</div>
}
