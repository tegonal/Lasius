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
 * Label component using DaisyUI classes with Tailwind CSS
 */

const labelVariants = cva(
	// Base DaisyUI label class
	'label cursor-pointer',
	{
		defaultVariants: {
			required: false,
			size: 'md',
			variant: 'default',
			weight: 'medium',
		},
		variants: {
			required: {
				false: '',
				true: "after:text-error after:ml-0.5 after:content-['*']",
			},
			size: {
				lg: 'text-lg',
				md: 'text-base',
				sm: 'text-sm',
				xs: 'text-xs',
			},
			variant: {
				accent: 'label-text text-accent',
				default: 'label-text',
				error: 'label-text text-error',
				info: 'label-text text-info',
				muted: 'label-text text-neutral/70',
				primary: 'label-text text-primary',
				secondary: 'label-text text-secondary',
				success: 'label-text text-success',
				warning: 'label-text text-warning',
			},
			weight: {
				bold: 'font-bold',
				medium: 'font-medium',
				normal: 'font-normal',
				semibold: 'font-semibold',
			},
		},
	},
)

export interface LabelProps
	extends
		React.LabelHTMLAttributes<HTMLLabelElement>,
		VariantProps<typeof labelVariants> {
	as?: 'label' | 'span'
	children: React.ReactNode
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
	(
		{
			as: Component = 'label',
			children,
			className,
			required,
			size,
			variant,
			weight,
			...props
		},
		ref,
	) => {
		const Element = Component as React.ElementType

		return (
			<Element
				className={cn(
					labelVariants({
						required,
						size,
						variant,
						weight,
					}),
					className,
				)}
				ref={ref}
				{...props}
			>
				{children}
			</Element>
		)
	},
)

Label.displayName = 'Label'

export type LabelSize = VariantProps<typeof labelVariants>['size']
// Export the variant types for use in other components
export type LabelVariant = VariantProps<typeof labelVariants>['variant']
export type LabelWeight = VariantProps<typeof labelVariants>['weight']
