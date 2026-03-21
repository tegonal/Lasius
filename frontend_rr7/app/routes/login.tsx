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

import { redirect, useLoaderData } from 'react-router'

import { getServerEnv } from '~/lib/env.server'
import { getOptionalUser } from '~/services/auth/auth-helpers.server'
import { getEnabledProviders } from '~/services/auth/providers'
import { type AuthProvider } from '~/services/auth/types'

import { type Route } from './+types/login'

const PROVIDER_DISPLAY_NAMES: Record<AuthProvider, string> = {
	github: 'GitHub',
	gitlab: 'GitLab',
	internal: 'Email & Password',
	keycloak: 'Keycloak',
}

export async function loader({ request }: Route.LoaderArgs) {
	const user = await getOptionalUser(request)
	const url = new URL(request.url)
	const returnTo = url.searchParams.get('returnTo') ?? '/en/'
	const error = url.searchParams.get('error') ?? null

	if (user) {
		throw redirect(returnTo)
	}

	const providers = getEnabledProviders()
	const demoMode = getServerEnv('LASIUS_DEMO_MODE') === 'true'
	const keycloakName = getServerEnv('KEYCLOAK_OAUTH_PROVIDER_NAME')

	return { demoMode, error, keycloakName, providers, returnTo }
}

export default function Login() {
	const { demoMode, error, keycloakName, providers, returnTo } =
		useLoaderData<typeof loader>()

	return (
		<div className="bg-base-200 flex min-h-screen items-center justify-center">
			<div className="card bg-base-100 w-full max-w-sm shadow-xl">
				<div className="card-body">
					<h2 className="card-title justify-center text-2xl">
						Sign in to Lasius
					</h2>

					{error && (
						<div className="alert alert-error">
							<span>
								{error === 'no_code'
									? 'Authentication failed: no authorization code received.'
									: error === 'state_mismatch'
										? 'Authentication failed: invalid state. Please try again.'
										: `Authentication failed: ${error}`}
							</span>
						</div>
					)}

					<div className="mt-4 flex flex-col gap-3">
						{providers.map((provider) => (
							<a
								className="btn btn-primary w-full"
								href={getProviderLoginUrl(provider, returnTo)}
								key={provider}
							>
								Sign in with {getProviderDisplayName(provider, keycloakName)}
							</a>
						))}
					</div>

					{providers.length === 0 && (
						<div className="alert alert-warning mt-4">
							<span>
								No authentication providers configured. Please check your
								environment variables.
							</span>
						</div>
					)}

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
				</div>
			</div>
		</div>
	)
}

function getProviderDisplayName(
	provider: AuthProvider,
	keycloakName: string | undefined,
): string {
	if (provider === 'keycloak' && keycloakName) {
		return keycloakName
	}
	return PROVIDER_DISPLAY_NAMES[provider]
}

function getProviderLoginUrl(provider: AuthProvider, returnTo: string): string {
	if (provider === 'internal') {
		return `/internal-oauth/login?returnTo=${encodeURIComponent(returnTo)}`
	}
	return `/oauth/${provider}/login?returnTo=${encodeURIComponent(returnTo)}`
}
