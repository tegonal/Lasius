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

const alertVariants = cva('alert', {
  variants: {
    variant: {
      info: 'alert-info',
      success: 'alert-success',
      warning: 'alert-warning',
      error: 'alert-error',
      neutral: '',
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
})

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  children: React.ReactNode
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(alertVariants({ variant }), className)} role="alert" {...props}>
        {children}
      </div>
    )
  },
)

Alert.displayName = 'Alert'

export type AlertVariant = VariantProps<typeof alertVariants>['variant']
