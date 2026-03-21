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

import {
	data,
	Form,
	redirect,
	useActionData,
	useLoaderData,
} from 'react-router'

import { getServerEnv } from '~/lib/env.server'
import { logger } from '~/lib/logger'
import { getOptionalUser } from '~/services/auth/auth-helpers.server'
import { getInternalProvider } from '~/services/auth/providers'
import { createUserSession } from '~/services/auth/session.server'

import { type Route } from './+types/internal-oauth.login'

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const email = formData.get('email')
	const password = formData.get('password')
	const returnTo = (formData.get('returnTo') as string) || '/en/'

	if (!email || typeof email !== 'string' || !email.trim()) {
		return data({ error: 'Email is required.' }, { status: 400 })
	}

	if (!password || typeof password !== 'string') {
		return data({ error: 'Password is required.' }, { status: 400 })
	}

	try {
		const provider = getInternalProvider()
		const result = await provider.loginWithCredentials(email.trim(), password)

		logger.debug('Internal login successful', { email: result.profile.email })

		return createUserSession(
			{
				accessToken: result.tokens.access_token,
				email: result.profile.email,
				expiresAt: Date.now() + result.tokens.expires_in * 1000,
				refreshToken: result.tokens.refresh_token ?? '',
				tokenIssuer: 'internal',
				userId: result.profile.userId,
			},
			returnTo,
		)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Login failed'
		logger.warn('Internal login failed', { email, error: message })

		if (message === 'Invalid credentials') {
			return data({ error: 'Invalid email or password.' }, { status: 401 })
		}

		return data({ error: 'Login failed. Please try again.' }, { status: 500 })
	}
}

export default function InternalOAuthLogin() {
	const { demoMode, returnTo } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()

	return (
		<div className="bg-base-200 flex min-h-screen items-center justify-center">
			<div className="card bg-base-100 w-full max-w-sm shadow-xl">
				<div className="card-body">
					<h2 className="card-title justify-center text-2xl">
						Sign in with Email
					</h2>

					{actionData?.error && (
						<div className="alert alert-error">
							<span>{actionData.error}</span>
						</div>
					)}

					<Form className="mt-4 flex flex-col gap-4" method="post">
						<input name="returnTo" type="hidden" value={returnTo} />

						<label className="floating-label">
							<span>Email</span>
							<input
								autoComplete="email"
								autoFocus
								className="input input-bordered w-full"
								name="email"
								placeholder="Email"
								required
								type="email"
							/>
						</label>

						<label className="floating-label">
							<span>Password</span>
							<input
								autoComplete="current-password"
								className="input input-bordered w-full"
								name="password"
								placeholder="Password"
								required
								type="password"
							/>
						</label>

						<button className="btn btn-primary w-full" type="submit">
							Sign in
						</button>
					</Form>

					{demoMode && (
						<div className="alert alert-info mt-4">
							<div>
								<p className="font-semibold">Demo Mode</p>
								<p className="text-sm">
									Use <code className="font-mono">demo1@lasius.ch</code> /{' '}
									<code className="font-mono">demo</code> or{' '}
									<code className="font-mono">demo2@lasius.ch</code> /{' '}
									<code className="font-mono">demo</code>
								</p>
							</div>
						</div>
					)}

					<div className="mt-4 text-center">
						<a className="link link-primary text-sm" href="/login">
							Back to login options
						</a>
					</div>
				</div>
			</div>
		</div>
	)
}

export async function loader({ request }: Route.LoaderArgs) {
	const user = await getOptionalUser(request)
	const url = new URL(request.url)
	const returnTo = url.searchParams.get('returnTo') ?? '/en/'

	if (user) {
		throw redirect(returnTo)
	}

	const demoMode = getServerEnv('LASIUS_DEMO_MODE') === 'true'

	return { demoMode, returnTo }
}
