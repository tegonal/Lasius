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

export default function HomeLayout() {
	return (
		<>
			{/* Desktop: 3-column grid */}
			<section className="hidden size-full overflow-auto md:block">
				<div className="grid size-full grid-cols-[17rem_auto_18rem] overflow-auto lg:grid-cols-[18rem_auto_19rem] xl:grid-cols-[19rem_auto_20rem] 2xl:grid-cols-[19rem_auto_24rem]">
					{/* Left column: navigation sidebar */}
					<div className="h-full w-full rounded-tl-xl">
						{/* TODO: NavigationMenuTabs */}
					</div>

					{/* Center: main content */}
					<Suspense
						fallback={
							<div className="flex h-full items-center justify-center">
								<span className="loading loading-spinner loading-lg text-primary" />
							</div>
						}
					>
						<Outlet />
					</Suspense>

					{/* Right column */}
					<div className="border-base-100 bg-base-200 text-base-content flex h-full w-full overflow-auto rounded-tr-xl border-l">
						{/* TODO: IndexColumnTabs */}
					</div>
				</div>
			</section>

			{/* Mobile: single column */}
			<section className="h-full w-full overflow-hidden md:hidden">
				<Outlet />
			</section>
		</>
	)
}
