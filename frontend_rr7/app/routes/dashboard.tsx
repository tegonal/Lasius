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

import { Outlet } from 'react-router'

import { DashboardTabs } from '~/features/dashboard/components/dashboard-tabs'

export default function DashboardLayout() {
	return (
		<div className="border-base-100 bg-base-100 text-base-content grid h-full w-full grid-rows-[min-content_auto] overflow-auto border-l">
			<div className="border-base-200 border-b px-4 pt-2">
				<DashboardTabs />
			</div>
			<div className="overflow-auto">
				<Outlet />
			</div>
		</div>
	)
}
