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

/**
 * Input component using DaisyUI classes with Tailwind CSS
 */

const inputVariants = cva(
  // Base DaisyUI input class
  'input w-full',
  {
    defaultVariants: {
      size: 'md',
      state: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        lg: 'input-lg',
        md: '', // default DaisyUI size
        sm: 'input-sm',
        xs: 'input-xs',
      },
      state: {
        default: '',
        disabled: 'input-disabled cursor-not-allowed opacity-50',
        loading: 'loading',
        readonly: 'cursor-default focus:outline-none',
      },
      variant: {
        accent: 'input-bordered input-accent',
        default: 'input-bordered',
        error: 'input-bordered input-error',
        filled: 'bg-base-200',
        ghost: 'input-ghost',
        info: 'input-bordered input-info',
        primary: 'input-bordered input-primary',
        secondary: 'input-bordered input-secondary',
        success: 'input-bordered input-success',
        warning: 'input-bordered input-warning',
      },
    },
  },
)

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  error?: boolean
  fullWidth?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      disabled,
      error,
      fullWidth = true,
      readOnly,
      size,
      state,
      variant,
      ...props
    },
    ref,
  ) => {
    // Determine the state based on props
    const inputState = disabled
      ? 'disabled'
      : readOnly
        ? 'readonly'
        : state || 'default'

    // Override variant if error prop is true
    const inputVariant = error ? 'error' : variant

    return (
      <input
        className={cn(
          inputVariants({
            size,
            state: inputState,
            variant: inputVariant,
          }),
          !fullWidth && 'w-auto',
          className,
        )}
        disabled={disabled}
        readOnly={readOnly}
        ref={ref}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export type InputSize = VariantProps<typeof inputVariants>['size']
export type InputState = VariantProps<typeof inputVariants>['state']
// Export the variant types for use in other components
export type InputVariant = VariantProps<typeof inputVariants>['variant']

/**
 * Textarea component using DaisyUI classes
 * Shares similar styling with Input component
 */
const textareaVariants = cva(
  // Base DaisyUI textarea class
  'textarea w-full',
  {
    defaultVariants: {
      size: 'md',
      state: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        lg: 'textarea-lg',
        md: '', // default DaisyUI size
        sm: 'textarea-sm',
        xs: 'textarea-xs',
      },
      state: {
        default: '',
        disabled: 'textarea-disabled cursor-not-allowed opacity-50',
        readonly: 'cursor-default focus:outline-none',
      },
      variant: {
        accent: 'textarea-bordered textarea-accent',
        default: 'textarea-bordered',
        error: 'textarea-bordered textarea-error',
        filled: 'bg-base-200',
        ghost: 'textarea-ghost',
        info: 'textarea-bordered textarea-info',
        primary: 'textarea-bordered textarea-primary',
        secondary: 'textarea-bordered textarea-secondary',
        success: 'textarea-bordered textarea-success',
        warning: 'textarea-bordered textarea-warning',
      },
    },
  },
)

export interface TextareaProps
  extends
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  error?: boolean
  fullWidth?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      disabled,
      error,
      fullWidth = true,
      readOnly,
      size,
      state,
      variant,
      ...props
    },
    ref,
  ) => {
    // Determine the state based on props
    const textareaState = disabled
      ? 'disabled'
      : readOnly
        ? 'readonly'
        : state || 'default'

    // Override variant if error prop is true
    const textareaVariant = error ? 'error' : variant

    return (
      <textarea
        className={cn(
          textareaVariants({
            size,
            state: textareaState,
            variant: textareaVariant,
          }),
          !fullWidth && 'w-auto',
          className,
        )}
        disabled={disabled}
        readOnly={readOnly}
        ref={ref}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'

export type TextareaSize = VariantProps<typeof textareaVariants>['size']
export type TextareaState = VariantProps<typeof textareaVariants>['state']
// Export the variant types for Textarea
export type TextareaVariant = VariantProps<typeof textareaVariants>['variant']
