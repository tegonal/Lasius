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
import { useEffect, useState } from 'react'

import { cn } from '~/lib/utils/cn'

const variants = cva('absolute', {
	defaultVariants: { variant: 'default' },
	variants: {
		variant: {
			compact: '-right-2',
			default: 'right-0 z-50',
		},
	},
})

type Props = VariantProps<typeof variants> & { children: React.ReactNode }

export const ContextAnimatePresence = ({
	children,
	variant = 'default',
}: Props) => {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		requestAnimationFrame(() => setMounted(true))
	}, [])

	return (
		<div
			className={cn(variants({ variant }))}
			style={{
				opacity: mounted ? 1 : 0,
				transform: mounted ? 'translateX(0)' : 'translateX(100%)',
				transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
			}}
		>
			{children}
		</div>
	)
}
