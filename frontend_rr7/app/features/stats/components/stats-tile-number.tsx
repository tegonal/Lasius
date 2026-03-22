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

import { useEffect, useRef } from 'react'

import { AnimateNumber } from '~/components/ui/animations/animate-number'

import { StatsTileWrapper } from './stats-tile-wrapper'

type Props = {
	label: string
	standalone?: boolean
	value: number
}

export const StatsTileNumber = ({ label, standalone = true, value }: Props) => {
	const previousValue = useRef<number>(0)
	useEffect(() => {
		previousValue.current = value
	}, [value])

	return (
		<StatsTileWrapper standalone={standalone}>
			<div className="stat h-fit">
				<div className="stat-title">{label}</div>
				<div className="stat-value text-2xl">
					<AnimateNumber from={previousValue.current} to={value} />
				</div>
			</div>
		</StatsTileWrapper>
	)
}
