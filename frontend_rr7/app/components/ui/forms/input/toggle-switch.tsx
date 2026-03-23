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

const toggleSwitchVariants = cva('toggle', {
  defaultVariants: {
    size: 'md',
    state: 'default',
    variant: 'default',
  },
  variants: {
    size: {
      lg: 'toggle-lg',
      md: 'toggle-md',
      sm: 'toggle-sm',
      xs: 'toggle-xs',
    },
    state: {
      default: '',
      disabled: 'cursor-not-allowed opacity-50',
    },
    variant: {
      accent: 'toggle-accent',
      default: 'toggle-primary',
      error: 'toggle-error',
      info: 'toggle-info',
      primary: 'toggle-primary',
      secondary: 'toggle-secondary',
      success: 'toggle-success',
      warning: 'toggle-warning',
    },
  },
})

export interface ToggleSwitchProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'onChange' | 'size' | 'type'
    >,
    VariantProps<typeof toggleSwitchVariants> {
  checked: boolean
  onChange: (checked: boolean) => void
}

export const ToggleSwitch = React.forwardRef<
  HTMLInputElement,
  ToggleSwitchProps
>(
  (
    { checked, className, disabled, onChange, size, state, variant, ...props },
    ref,
  ) => {
    const toggleState = disabled ? 'disabled' : state || 'default'

    return (
      <input
        checked={checked}
        className={cn(
          toggleSwitchVariants({
            size,
            state: toggleState,
            variant,
          }),
          className,
        )}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        ref={ref}
        type="checkbox"
        {...props}
      />
    )
  },
)

ToggleSwitch.displayName = 'ToggleSwitch'
