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
import {
	AlertCircle,
	AlertTriangle,
	CheckCircle,
	Info,
	XCircle,
} from 'lucide-react'
import React from 'react'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { cn } from '~/lib/utils/cn'

const alertVariants = cva('alert', {
	defaultVariants: {
		variant: 'neutral',
	},
	variants: {
		variant: {
			error: 'alert-error',
			info: 'alert-info',
			neutral: '',
			success: 'alert-success',
			warning: 'alert-warning',
		},
	},
})

const iconMap = {
	error: XCircle,
	info: Info,
	neutral: AlertCircle,
	success: CheckCircle,
	warning: AlertTriangle,
} as const

export interface AlertProps
	extends
		React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof alertVariants> {
	children: React.ReactNode
	hideIcon?: boolean
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
	(
		{ children, className, hideIcon = false, variant = 'neutral', ...props },
		ref,
	) => {
		const IconComponent = iconMap[variant || 'neutral']

		return (
			<div
				className={cn(
					alertVariants({ variant }),
					'flex items-center gap-3',
					className,
				)}
				ref={ref}
				role="alert"
				{...props}
			>
				{!hideIcon && (
					<>
						<div className="flex-shrink-0">
							<LucideIcon icon={IconComponent} size={20} />
						</div>
						<div className="divider divider-horizontal m-0 before:w-px after:w-px"></div>
					</>
				)}
				<div className="min-w-0 flex-1">{children}</div>
			</div>
		)
	},
)

Alert.displayName = 'Alert'

export type AlertVariant = VariantProps<typeof alertVariants>['variant']
