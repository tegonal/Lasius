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

const cardVariants = cva('card', {
  variants: {
    variant: {
      default: 'bg-base-100',
      bordered: 'card-bordered',
      dashed: 'card-dash',
    },
    size: {
      xs: 'card-xs',
      sm: 'card-sm',
      md: '',
      lg: 'card-lg',
      xl: 'card-xl',
    },
    layout: {
      default: '',
      side: 'card-side',
      imageFull: 'image-full',
    },
    shadow: {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    layout: 'default',
    shadow: 'none',
  },
})

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, layout, shadow, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, size, layout, shadow }), className)}
        {...props}>
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'

// Card sub-components

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('card-body', className)} {...props}>
        {children}
      </div>
    )
  },
)

CardBody.displayName = 'CardBody'

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, as: Component = 'h2', ...props }, ref) => {
    return (
      <Component ref={ref} className={cn('card-title', className)} {...props}>
        {children}
      </Component>
    )
  },
)

CardTitle.displayName = 'CardTitle'

export interface CardActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
}

export const CardActions = React.forwardRef<HTMLDivElement, CardActionsProps>(
  ({ className, children, justify = 'end', ...props }, ref) => {
    const justifyClasses = {
      start: 'justify-start',
      end: 'justify-end',
      center: 'justify-center',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    }

    return (
      <div ref={ref} className={cn('card-actions', justifyClasses[justify], className)} {...props}>
        {children}
      </div>
    )
  },
)

CardActions.displayName = 'CardActions'

export interface CardFigureProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export const CardFigure = React.forwardRef<HTMLElement, CardFigureProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <figure ref={ref} className={cn(className)} {...props}>
        {children}
      </figure>
    )
  },
)

CardFigure.displayName = 'CardFigure'

// Export variant types for use in other components
export type CardVariant = VariantProps<typeof cardVariants>['variant']
export type CardSize = VariantProps<typeof cardVariants>['size']
export type CardLayout = VariantProps<typeof cardVariants>['layout']
export type CardShadow = VariantProps<typeof cardVariants>['shadow']
