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
 * ToggleSwitch component using DaisyUI toggle classes
 */

const toggleSwitchVariants = cva(
  // Base DaisyUI toggle class
  'toggle',
  {
    variants: {
      variant: {
        default: 'toggle-primary',
        primary: 'toggle-primary',
        secondary: 'toggle-secondary',
        accent: 'toggle-accent',
        success: 'toggle-success',
        warning: 'toggle-warning',
        info: 'toggle-info',
        error: 'toggle-error',
      },
      size: {
        xs: 'toggle-xs',
        sm: 'toggle-sm',
        md: 'toggle-md',
        lg: 'toggle-lg',
      },
      state: {
        default: '',
        disabled: 'cursor-not-allowed opacity-50',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
    },
  },
)

export interface ToggleSwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'>,
    VariantProps<typeof toggleSwitchVariants> {
  checked: boolean
  onChange: (checked: boolean) => void
}

export const ToggleSwitch = React.forwardRef<HTMLInputElement, ToggleSwitchProps>(
  ({ className, variant, size, state, disabled, checked, onChange, ...props }, ref) => {
    // Determine the state based on props
    const toggleState = disabled ? 'disabled' : state || 'default'

    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          toggleSwitchVariants({
            variant,
            size,
            state: toggleState,
          }),
          className,
        )}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        {...props}
      />
    )
  },
)

ToggleSwitch.displayName = 'ToggleSwitch'
