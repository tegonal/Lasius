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
import { m } from 'framer-motion'
import { cn } from 'lib/utils/cn'
import React from 'react'

const contextAnimatePresenceVariants = cva('absolute', {
  variants: {
    variant: {
      default: 'right-0 z-50',
      compact: '-right-2',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

type Props = {
  children: React.ReactNode
} & VariantProps<typeof contextAnimatePresenceVariants>

export const ContextAnimatePresence: React.FC<Props> = ({ children, variant = 'default' }) => {
  return (
    <m.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ ease: 'easeInOut', duration: 0.2 }}
      className={cn(contextAnimatePresenceVariants({ variant }))}>
      {children}
    </m.div>
  )
}
