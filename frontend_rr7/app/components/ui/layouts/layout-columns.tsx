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

import { type ReactNode } from 'react'

/**
 * Shared 3-column layout primitives for the nested grid layout.
 *
 * Original 3-column grid (Next.js):
 *   grid-cols-[17rem_auto_18rem]  (md)
 *   grid-cols-[18rem_auto_19rem]  (lg)
 *   grid-cols-[19rem_auto_20rem]  (xl)
 *   grid-cols-[19rem_auto_24rem]  (2xl)
 *
 * With React Router nested routes we split this into two grids:
 *   Outer (user.home.tsx):  grid-cols-[left_auto]   — ColumnLeft + Outlet
 *   Inner (child routes):   grid-cols-[auto_right]   — ColumnCenter + ColumnRight
 *
 * Both grids reference the same responsive widths to maintain identical layout.
 */

/** Outer grid: left nav + content area. Rendered by user.home.tsx. */
export const outerGridClasses =
	'grid size-full overflow-auto grid-cols-[17rem_auto] lg:grid-cols-[18rem_auto] xl:grid-cols-[19rem_auto] 2xl:grid-cols-[19rem_auto]'

/** Inner grid: center content + right sidebar. Rendered by child routes. */
export const innerGridClasses =
	'grid size-full overflow-auto grid-cols-[auto_18rem] lg:grid-cols-[auto_19rem] xl:grid-cols-[auto_20rem] 2xl:grid-cols-[auto_24rem]'

export const ColumnCenter = ({ children }: { children: ReactNode }) => {
	return (
		<div className="border-base-100 bg-base-100 text-base-content h-full min-w-0 overflow-auto border-l">
			{children}
		</div>
	)
}

export const ColumnLeft = ({ children }: { children: ReactNode }) => {
	return <div className="h-full w-full rounded-tl-xl">{children}</div>
}

export const ColumnRight = ({ children }: { children?: ReactNode }) => {
	return (
		<div className="border-base-100 bg-base-200 text-base-content h-full overflow-hidden rounded-tr-xl border-l">
			{children}
		</div>
	)
}
