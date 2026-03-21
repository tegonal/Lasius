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

const cardVariants = cva('card', {
	defaultVariants: {
		layout: 'default',
		shadow: 'none',
		size: 'md',
		variant: 'default',
	},
	variants: {
		layout: {
			default: '',
			imageFull: 'image-full',
			side: 'card-side',
		},
		shadow: {
			lg: 'shadow-lg',
			md: 'shadow-md',
			none: '',
			sm: 'shadow-sm',
			xl: 'shadow-xl',
		},
		size: {
			lg: 'card-lg',
			md: '',
			sm: 'card-sm',
			xl: 'card-xl',
			xs: 'card-xs',
		},
		variant: {
			bordered: 'card-bordered',
			dashed: 'card-dash',
			default: 'bg-base-100',
		},
	},
})

export interface CardProps
	extends
		React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof cardVariants> {
	children: React.ReactNode
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
	({ children, className, layout, shadow, size, variant, ...props }, ref) => {
		return (
			<div
				className={cn(
					cardVariants({ layout, shadow, size, variant }),
					className,
				)}
				ref={ref}
				{...props}
			>
				{children}
			</div>
		)
	},
)

Card.displayName = 'Card'

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode
}

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
	({ children, className, ...props }, ref) => {
		return (
			<div className={cn('card-body', className)} ref={ref} {...props}>
				{children}
			</div>
		)
	},
)

CardBody.displayName = 'CardBody'

export type CardLayout = VariantProps<typeof cardVariants>['layout']
export type CardShadow = VariantProps<typeof cardVariants>['shadow']
export type CardSize = VariantProps<typeof cardVariants>['size']
export type CardVariant = VariantProps<typeof cardVariants>['variant']
