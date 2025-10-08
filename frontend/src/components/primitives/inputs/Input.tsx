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
 * Input component using DaisyUI classes with Tailwind CSS
 * This component replaces Theme-UI Input during migration
 */

const inputVariants = cva(
  // Base DaisyUI input class
  'input w-full',
  {
    variants: {
      variant: {
        default: 'input-bordered',
        primary: 'input-bordered input-primary',
        secondary: 'input-bordered input-secondary',
        accent: 'input-bordered input-accent',
        ghost: 'input-ghost',
        error: 'input-bordered input-error',
        warning: 'input-bordered input-warning',
        info: 'input-bordered input-info',
        success: 'input-bordered input-success',
        filled: 'bg-base-200',
      },
      size: {
        xs: 'input-xs',
        sm: 'input-sm',
        md: '', // default DaisyUI size
        lg: 'input-lg',
      },
      state: {
        default: '',
        disabled: 'input-disabled cursor-not-allowed opacity-50',
        readonly: 'cursor-default focus:outline-none',
        loading: 'loading',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
    },
  },
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  fullWidth?: boolean
  error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, variant, size, state, fullWidth = true, error, disabled, readOnly, ...props },
    ref,
  ) => {
    // Determine the state based on props
    const inputState = disabled ? 'disabled' : readOnly ? 'readonly' : state || 'default'

    // Override variant if error prop is true
    const inputVariant = error ? 'error' : variant

    return (
      <input
        ref={ref}
        className={cn(
          inputVariants({
            variant: inputVariant,
            size,
            state: inputState,
          }),
          !fullWidth && 'w-auto',
          className,
        )}
        disabled={disabled}
        readOnly={readOnly}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

// Export the variant types for use in other components
export type InputVariant = VariantProps<typeof inputVariants>['variant']
export type InputSize = VariantProps<typeof inputVariants>['size']
export type InputState = VariantProps<typeof inputVariants>['state']

/**
 * Textarea component using DaisyUI classes
 * Shares similar styling with Input component
 */
const textareaVariants = cva(
  // Base DaisyUI textarea class
  'textarea w-full',
  {
    variants: {
      variant: {
        default: 'textarea-bordered',
        primary: 'textarea-bordered textarea-primary',
        secondary: 'textarea-bordered textarea-secondary',
        accent: 'textarea-bordered textarea-accent',
        ghost: 'textarea-ghost',
        error: 'textarea-bordered textarea-error',
        warning: 'textarea-bordered textarea-warning',
        info: 'textarea-bordered textarea-info',
        success: 'textarea-bordered textarea-success',
        filled: 'bg-base-200',
      },
      size: {
        xs: 'textarea-xs',
        sm: 'textarea-sm',
        md: '', // default DaisyUI size
        lg: 'textarea-lg',
      },
      state: {
        default: '',
        disabled: 'textarea-disabled cursor-not-allowed opacity-50',
        readonly: 'cursor-default focus:outline-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
    },
  },
)

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  fullWidth?: boolean
  error?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, variant, size, state, fullWidth = true, error, disabled, readOnly, ...props },
    ref,
  ) => {
    // Determine the state based on props
    const textareaState = disabled ? 'disabled' : readOnly ? 'readonly' : state || 'default'

    // Override variant if error prop is true
    const textareaVariant = error ? 'error' : variant

    return (
      <textarea
        ref={ref}
        className={cn(
          textareaVariants({
            variant: textareaVariant,
            size,
            state: textareaState,
          }),
          !fullWidth && 'w-auto',
          className,
        )}
        disabled={disabled}
        readOnly={readOnly}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'

// Export the variant types for Textarea
export type TextareaVariant = VariantProps<typeof textareaVariants>['variant']
export type TextareaSize = VariantProps<typeof textareaVariants>['size']
export type TextareaState = VariantProps<typeof textareaVariants>['state']
