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
 * Button component using DaisyUI classes with Tailwind CSS
 * This component replaces Theme-UI Button during migration
 */

const buttonVariants = cva(
  // Base DaisyUI button class
  'btn flex items-center justify-center gap-2',
  {
    variants: {
      variant: {
        primary: 'bg-primary-gradient hover:bg-primary-gradient-hover border-none text-white',
        secondary: 'bg-neutral-gradient hover:bg-neutral-gradient-hover border-none text-white',
        accent: 'btn-accent',
        success: 'btn-success',
        warning: 'btn-warning',
        error: 'bg-red-gradient hover:bg-red-gradient-hover border-none text-white',
        info: 'btn-info',
        ghost: 'btn-ghost',
        tabs: 'btn-ghost h-auto border-none p-3 shadow-none [.selected_&]:bg-transparent [.selected_&]:text-white',
        link: 'btn-link',
        outline: 'btn-outline',
        neutral: 'btn-neutral',
        icon: 'btn-ghost btn-square',
        iconMuted: 'btn-ghost btn-square opacity-60 hover:opacity-100',
        stopRecording:
          'bg-red-gradient hover:bg-red-gradient-hover mt-1 h-auto w-auto min-w-0 flex-col rounded-full border-none p-2 text-white shadow-sm',
        contextIcon:
          'text-neutral-content hover:bg-neutral-content/20 h-auto min-h-0 border-none bg-transparent p-2 shadow-none',
        navigation: 'btn-ghost h-auto justify-start gap-3 p-3 text-left',
        navigationActive: 'btn-ghost bg-base-content/10 h-auto justify-start gap-3 p-3 text-left',
        unstyled:
          'btn-ghost hover:text-primary h-auto min-h-0 border-none p-0 font-normal text-inherit shadow-none hover:bg-transparent',
      },
      size: {
        xs: "btn-xs font-normal' text-sm",
        sm: 'btn-sm text-sm font-normal',
        md: 'text-base font-normal', // default DaisyUI size
        lg: 'btn-lg text-base font-normal',
        wide: 'btn-wide text-base font-normal',
        block: 'btn-block text-base font-normal',
      },
      shape: {
        default: '',
        square: 'btn-square',
        circle: 'btn-circle',
      },
      loading: {
        true: 'loading',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      shape: 'default',
      loading: false,
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, 'disabled'> {
  children: React.ReactNode
  asChild?: boolean
  fullWidth?: boolean
  join?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      loading,
      disabled,
      children,
      fullWidth = true,
      join = false,
      ...props
    },
    ref,
  ) => {
    const isDisabled = !!disabled || !!loading

    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({
            variant,
            size,
            shape,
            loading,
          }),
          fullWidth && 'w-full',
          isDisabled && 'btn-disabled',
          join && 'join-item',
          className,
        )}
        disabled={isDisabled}
        {...props}>
        {loading && <span className="loading loading-spinner"></span>}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

// Export the variant type for use in other components
export type ButtonVariant = VariantProps<typeof buttonVariants>['variant']
export type ButtonSize = VariantProps<typeof buttonVariants>['size']
export type ButtonShape = VariantProps<typeof buttonVariants>['shape']
