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

import { getServerEnv } from '~/lib/env.server'

import { type AuthProvider, type OAuthProvider } from '../types'
import { createGitHubProvider } from './github.server'
import { createGitLabProvider } from './gitlab.server'
import {
	createInternalProvider,
	type InternalOAuthProvider,
} from './internal.server'
import { createKeycloakProvider } from './keycloak.server'

/**
 * Lazily-initialized provider cache.
 * Providers are created once on first access and reused for the process lifetime.
 */
const providerCache = new Map<AuthProvider, OAuthProvider>()

/**
 * Determines which providers are enabled based on environment variables.
 * A provider is enabled if its required credentials are set.
 *
 * Detection logic (matches current Next.js behavior):
 * - internal: enabled if LASIUS_OAUTH_CLIENT_ID is set
 * - keycloak: enabled if KEYCLOAK_OAUTH_CLIENT_ID is set
 * - github: enabled if GITHUB_OAUTH_CLIENT_ID is set
 * - gitlab: enabled if GITLAB_OAUTH_CLIENT_ID is set
 */
export function getEnabledProviders(): AuthProvider[] {
	const providers: AuthProvider[] = []

	if (getServerEnv('LASIUS_OAUTH_CLIENT_ID')) {
		providers.push('internal')
	}
	if (getServerEnv('KEYCLOAK_OAUTH_CLIENT_ID')) {
		providers.push('keycloak')
	}
	if (getServerEnv('GITHUB_OAUTH_CLIENT_ID')) {
		providers.push('github')
	}
	if (getServerEnv('GITLAB_OAUTH_CLIENT_ID')) {
		providers.push('gitlab')
	}

	return providers
}

/** Get the internal provider (typed with loginWithCredentials) */
export function getInternalProvider(): InternalOAuthProvider {
	return getProvider('internal') as InternalOAuthProvider
}

/** Get a provider instance by issuer name. Throws if not enabled. */
export function getProvider(issuer: AuthProvider): OAuthProvider {
	const cached = providerCache.get(issuer)
	if (cached) return cached

	const provider = createProvider(issuer)
	providerCache.set(issuer, provider)
	return provider
}

/** Check if a specific provider is enabled */
export function isProviderEnabled(provider: AuthProvider): boolean {
	return getEnabledProviders().includes(provider)
}

function createProvider(issuer: AuthProvider): OAuthProvider {
	switch (issuer) {
		case 'github':
			return createGitHubProvider()
		case 'gitlab':
			return createGitLabProvider()
		case 'internal':
			return createInternalProvider()
		case 'keycloak':
			return createKeycloakProvider()
		default:
			throw new Error(`Unknown auth provider: ${issuer as string}`)
	}
}
