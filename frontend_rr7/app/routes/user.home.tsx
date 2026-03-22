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

import { Suspense } from 'react'
import { Outlet } from 'react-router'

import {
	ColumnLeft,
	outerGridClasses,
} from '~/components/ui/layouts/layout-columns'
import { NavigationMenuTabs } from '~/features/navigation/components/navigation-menu-tabs'

export default function HomeLayout() {
	return (
		<>
			{/* Desktop: left nav + content area (children use ColumnCenter/ColumnRight) */}
			<section className="hidden size-full overflow-auto md:block">
				<div className={outerGridClasses}>
					<ColumnLeft>
						<NavigationMenuTabs />
					</ColumnLeft>
					<Suspense
						fallback={
							<div className="flex h-full flex-1 items-center justify-center">
								<span className="loading loading-spinner loading-lg text-primary" />
							</div>
						}
					>
						<Outlet />
					</Suspense>
				</div>
			</section>

			{/* Mobile: single column */}
			<section className="h-full w-full overflow-hidden md:hidden">
				<Outlet />
			</section>
		</>
	)
}
