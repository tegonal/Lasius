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

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const STAR_COUNT = 10
const STAR_ANIMATION_DURATION = 800

const StarSvg = () => (
	<svg fill="currentColor" height="100%" viewBox="0 0 24 24" width="100%">
		<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
	</svg>
)

interface StarParticle {
	angle: number
	distance: number
	drift: number
	id: number
	rotation: number
	size: number
	speed: number
	x: number
	y: number
}

const generateStars = (originX: number, originY: number): StarParticle[] =>
	Array.from({ length: STAR_COUNT }, (_, i) => {
		const angle = (360 / STAR_COUNT) * i + (Math.random() * 30 - 15)
		const distance = 20 + Math.random() * 30
		return {
			angle,
			distance,
			drift: (Math.random() - 0.5) * 15,
			id: i,
			rotation: Math.random() * 1440 - 720,
			size: 8 + Math.random() * 10,
			speed: 0.7 + Math.random() * 0.6,
			x: originX,
			y: originY,
		}
	})

const StarExplosion = ({ stars }: { stars: StarParticle[] }) => {
	return createPortal(
		<>
			{stars.map((star) => {
				const rad = (star.angle * Math.PI) / 180
				// Elliptical trajectory: wider horizontally, narrower vertically
				const tx = Math.cos(rad) * star.distance * 1.6 + star.drift
				const ty = Math.sin(rad) * star.distance * 0.7 + star.drift * 0.5
				const duration = STAR_ANIMATION_DURATION * star.speed

				return (
					<div
						className="pointer-events-none fixed z-[9999] text-yellow-400"
						key={star.id}
						style={{
							['--star-rot' as string]: `${star.rotation}deg`,
							['--star-tx' as string]: `${tx}px`,
							['--star-ty' as string]: `${ty}px`,
							animation: `star-explode ${duration}ms ease-out forwards`,
							height: star.size,
							left: star.x,
							top: star.y,
							width: star.size,
						}}
					>
						<StarSvg />
					</div>
				)
			})}
		</>,
		document.body,
	)
}

export const ProgressBar = memo(
	({ label, percentage }: { label: string; percentage: number }) => {
		const [animated, setAnimated] = useState(false)
		const [stars, setStars] = useState<null | StarParticle[]>(null)
		const fillRef = useRef<HTMLDivElement>(null)
		const hasExplodedRef = useRef(false)

		const visualPercentage = percentage >= 100 ? 100 : Math.min(percentage, 97)
		const normalizedDisplayPercentage = Math.min(visualPercentage, 100)
		const overflowDisplayPercentage = Math.max(0, percentage - 100)

		useEffect(() => {
			// Trigger animation after mount
			const frame = requestAnimationFrame(() => {
				setAnimated(true)
			})
			return () => cancelAnimationFrame(frame)
		}, [])

		const handleTransitionEnd = useCallback(() => {
			if (percentage >= 100 && !hasExplodedRef.current && fillRef.current) {
				hasExplodedRef.current = true
				const rect = fillRef.current.getBoundingClientRect()
				const originX = rect.right
				const originY = rect.top + rect.height / 2
				const newStars = generateStars(originX, originY)
				setStars(newStars)
				setTimeout(() => setStars(null), STAR_ANIMATION_DURATION)
			}
		}, [percentage])

		return (
			<div className="relative w-full" title={label}>
				<div className="space-y-[2px]">
					{/* Main progress bar */}
					<div className="bg-base-content/25 relative h-[5px] w-full overflow-visible text-[10px]">
						<div className="absolute inset-0 overflow-hidden">
							<div
								className="bg-secondary dark:bg-base-content/75 h-full max-w-full"
								onTransitionEnd={handleTransitionEnd}
								ref={fillRef}
								style={{
									transition: 'width 1s ease-in-out',
									width: animated ? `${normalizedDisplayPercentage}%` : '0%',
									willChange: 'width',
								}}
							/>
						</div>
					</div>
					{/* Overflow bar — fills when > 100% */}
					<div className="bg-base-content/15 h-[3px] w-full overflow-hidden">
						{percentage > 100 && (
							<div
								className="bg-warning h-full max-w-full"
								style={{
									transition: `width 1s ease-in-out ${normalizedDisplayPercentage === 100 ? '1s' : '0s'}`,
									width: animated
										? `${Math.min(overflowDisplayPercentage, 100)}%`
										: '0%',
									willChange: 'width',
								}}
							/>
						)}
					</div>
				</div>
				{stars && <StarExplosion stars={stars} />}
			</div>
		)
	},
)
