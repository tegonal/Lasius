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

import { getServerEnvRequired } from '~/lib/env.server'
import { logger } from '~/lib/logger'

import { type OAuthProvider, type TokenResponse } from '../types'

export function createKeycloakProvider(): OAuthProvider {
	const clientId = getServerEnvRequired('KEYCLOAK_OAUTH_CLIENT_ID')
	const clientSecret = getServerEnvRequired('KEYCLOAK_OAUTH_CLIENT_SECRET')
	const baseUrl = getServerEnvRequired('KEYCLOAK_OAUTH_URL')

	const authorizationUrl = `${baseUrl}/protocol/openid-connect/auth`
	const tokenUrl = `${baseUrl}/protocol/openid-connect/token`
	const userinfoUrl = `${baseUrl}/protocol/openid-connect/userinfo`
	const revokeUrl = `${baseUrl}/protocol/openid-connect/revoke`

	return {
		async exchangeCode(code: string): Promise<TokenResponse> {
			const response = await fetch(tokenUrl, {
				body: new URLSearchParams({
					client_id: clientId,
					client_secret: clientSecret,
					code,
					grant_type: 'authorization_code',
				}),
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				method: 'POST',
			})

			if (!response.ok) {
				const error = await response.text()
				logger.error('Keycloak token exchange failed', {
					error,
					status: response.status,
				})
				throw new Error(`Keycloak token exchange failed: ${response.status}`)
			}

			return (await response.json()) as TokenResponse
		},

		getAuthorizationUrl(state: string): string {
			const url = new URL(authorizationUrl)
			url.searchParams.set('client_id', clientId)
			url.searchParams.set('response_type', 'code')
			url.searchParams.set('scope', 'openid profile email')
			url.searchParams.set('state', state)
			return url.toString()
		},

		async getUserProfile(
			accessToken: string,
		): Promise<{ email: string; userId: string }> {
			const response = await fetch(userinfoUrl, {
				headers: { Authorization: `Bearer ${accessToken}` },
			})

			if (!response.ok) {
				throw new Error(`Keycloak userinfo failed: ${response.status}`)
			}

			const profile = (await response.json()) as { email: string; sub: string }
			return { email: profile.email, userId: profile.sub }
		},

		provider: 'keycloak',

		async refreshToken(
			refreshTokenValue: string,
		): Promise<null | TokenResponse> {
			try {
				const response = await fetch(tokenUrl, {
					body: new URLSearchParams({
						client_id: clientId,
						client_secret: clientSecret,
						grant_type: 'refresh_token',
						refresh_token: refreshTokenValue,
					}),
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					method: 'POST',
				})

				if (!response.ok) {
					logger.warn('Keycloak token refresh failed', {
						status: response.status,
					})
					return null
				}

				return (await response.json()) as TokenResponse
			} catch (error) {
				logger.error('Keycloak token refresh error', { error })
				return null
			}
		},

		async revokeToken(token: string): Promise<void> {
			try {
				await fetch(revokeUrl, {
					body: new URLSearchParams({
						client_id: clientId,
						client_secret: clientSecret,
						token,
					}),
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					method: 'POST',
				})
			} catch (error) {
				logger.warn('Keycloak token revocation failed', { error })
			}
		},
	}
}
