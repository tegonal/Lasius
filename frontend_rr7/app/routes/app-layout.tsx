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

import { data, Outlet } from 'react-router'

import { requireUser } from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/app-layout'

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireUser(request)
	return data({
		user: {
			email: session.email,
			userId: session.userId,
		},
	})
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
	return (
		<div className="bg-base-100 min-h-screen">
			<header className="navbar bg-base-200 shadow-sm">
				<div className="flex-1">
					<span className="text-xl font-bold">Lasius</span>
				</div>
				<div className="flex-none gap-2">
					<span className="text-sm">{loaderData.user.email}</span>
					<form action="/logout" method="post">
						<button className="btn btn-ghost btn-sm" type="submit">
							Logout
						</button>
					</form>
				</div>
			</header>
			<main className="container mx-auto p-4">
				<Outlet />
			</main>
		</div>
	)
}
