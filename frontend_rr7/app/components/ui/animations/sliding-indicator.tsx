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

import { type RefObject, useEffect, useState } from 'react'

import { cn } from '~/lib/utils/cn'

const radiusClasses = {
	all: 'rounded-md',
	bottom: 'rounded-b-md',
	left: 'rounded-l-md',
	right: 'rounded-r-md',
	top: 'rounded-t-md',
} as const

export const SlidingIndicator = ({
	className,
	itemRefs,
	radiusOn = 'all',
	selectedIndex,
}: {
	className?: string
	itemRefs: RefObject<(HTMLElement | null)[]>
	radiusOn?: keyof typeof radiusClasses
	selectedIndex: number
}) => {
	const [indicatorStyle, setIndicatorStyle] = useState({
		height: 0,
		left: 0,
		top: 0,
		width: 0,
	})
	const [isMounted, setIsMounted] = useState(false)
	const [isPositioned, setIsPositioned] = useState(false)

	useEffect(() => {
		if (selectedIndex !== -1) {
			requestAnimationFrame(() => {
				const element = itemRefs.current[selectedIndex]
				if (element) {
					const rect = element.getBoundingClientRect()
					const containerRect = element.parentElement!.getBoundingClientRect()
					setIndicatorStyle({
						height: rect.height,
						left: rect.left - containerRect.left,
						top: rect.top - containerRect.top,
						width: rect.width,
					})
					if (!isPositioned) {
						setIsPositioned(true)
						// Allow the browser to paint at opacity-0 before fading in
						setTimeout(() => {
							setIsMounted(true)
						}, 50)
					}
				}
			})
		}
	}, [selectedIndex, itemRefs, isPositioned])

	if (!isPositioned) return null

	return (
		<div className="pointer-events-none absolute inset-0">
			<div
				className={cn(
					'bg-red-gradient absolute',
					radiusClasses[radiusOn],
					className,
				)}
				style={{
					height: `${indicatorStyle.height}px`,
					left: `${indicatorStyle.left}px`,
					opacity: isMounted ? 1 : 0,
					top: `${indicatorStyle.top}px`,
					transition:
						'left 200ms ease-out, top 200ms ease-out, width 200ms ease-out, height 200ms ease-out, opacity 300ms ease-out',
					width: `${indicatorStyle.width}px`,
					willChange: 'left, top, width, height, opacity',
				}}
			/>
		</div>
	)
}
