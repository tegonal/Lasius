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

import { memo, useEffect, useState } from 'react'

export const ProgressBar = memo(
	({ label, percentage }: { label: string; percentage: number }) => {
		const [animated, setAnimated] = useState(false)

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

		return (
			<div className="relative w-full" title={label}>
				<div className="space-y-[2px]">
					{/* Main progress bar */}
					<div className="bg-base-content/25 relative h-[5px] w-full overflow-visible text-[10px]">
						<div className="absolute inset-0 overflow-hidden">
							<div
								className="bg-secondary dark:bg-base-content/75 h-full max-w-full"
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
			</div>
		)
	},
)
