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

import { data } from 'react-router'

import { getUserProfile } from '~/services/api/lasius/user/user'
import { authHeaders, requireUser } from '~/services/auth/auth-helpers.server'
import { logger } from '~/services/logger'

import { type Route } from './+types/dashboard'

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireUser(request)

	try {
		const result = await getUserProfile({
			headers: authHeaders(session),
		})

		return data({
			error: null,
			profile: result.data,
		})
	} catch (error) {
		logger.warn('Failed to fetch user profile in dashboard loader', error)
		return data({
			error: 'Failed to load user profile',
			profile: null,
		})
	}
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
	const { error, profile } = loaderData

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Dashboard</h1>

			{error && (
				<div className="alert alert-warning">
					<span>{error}</span>
				</div>
			)}

			{profile && (
				<div className="card bg-base-200 shadow-sm">
					<div className="card-body">
						<h2 className="card-title">User Profile</h2>
						<p>
							<strong>Name:</strong> {profile.firstName} {profile.lastName}
						</p>
						<p>
							<strong>Email:</strong> {profile.email}
						</p>
					</div>
				</div>
			)}

			{!profile && !error && (
				<div className="flex justify-center p-8">
					<span className="loading loading-spinner loading-lg" />
				</div>
			)}
		</div>
	)
}
