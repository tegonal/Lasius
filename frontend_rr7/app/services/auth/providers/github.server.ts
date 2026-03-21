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

interface GitHubEmail {
	email: string
	primary: boolean
	verified: boolean
}

export function createGitHubProvider(): OAuthProvider {
	const clientId = getServerEnvRequired('GITHUB_OAUTH_CLIENT_ID')
	const clientSecret = getServerEnvRequired('GITHUB_OAUTH_CLIENT_SECRET')

	return {
		async exchangeCode(
			code: string,
			redirectUri: string,
		): Promise<TokenResponse> {
			const response = await fetch(
				'https://github.com/login/oauth/access_token',
				{
					body: new URLSearchParams({
						client_id: clientId,
						client_secret: clientSecret,
						code,
						redirect_uri: redirectUri,
					}),
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					method: 'POST',
				},
			)

			if (!response.ok) {
				const error = await response.text()
				logger.error('GitHub token exchange failed', {
					error,
					status: response.status,
				})
				throw new Error(`GitHub token exchange failed: ${response.status}`)
			}

			const data = (await response.json()) as {
				access_token: string
				scope: string
				token_type: string
			}

			// GitHub tokens don't expire by default — set a long expiry
			return {
				access_token: data.access_token,
				expires_in: 60 * 60 * 24 * 365, // 1 year
				scope: data.scope,
				token_type: data.token_type,
			}
		},

		getAuthorizationUrl(state: string, redirectUri: string): string {
			const url = new URL('https://github.com/login/oauth/authorize')
			url.searchParams.set('client_id', clientId)
			url.searchParams.set('scope', 'read:user user:email')
			url.searchParams.set('state', state)
			url.searchParams.set('redirect_uri', redirectUri)
			return url.toString()
		},

		async getUserProfile(
			accessToken: string,
		): Promise<{ email: string; userId: string }> {
			const [userResponse, emailsResponse] = await Promise.all([
				fetch('https://api.github.com/user', {
					headers: {
						Accept: 'application/json',
						Authorization: `Bearer ${accessToken}`,
					},
				}),
				fetch('https://api.github.com/user/emails', {
					headers: {
						Accept: 'application/json',
						Authorization: `Bearer ${accessToken}`,
					},
				}),
			])

			if (!userResponse.ok) {
				throw new Error(`GitHub user profile failed: ${userResponse.status}`)
			}

			const user = (await userResponse.json()) as { id: number }
			const userId = user.id.toString()

			let email = ''
			if (emailsResponse.ok) {
				const emails = (await emailsResponse.json()) as GitHubEmail[]
				const primary = emails.find((e) => e.primary && e.verified)
				email = primary?.email ?? emails[0]?.email ?? ''
			}

			return { email, userId }
		},

		provider: 'github',

		async refreshToken(): Promise<null | TokenResponse> {
			// GitHub tokens don't support refresh — they don't expire by default
			logger.debug('GitHub tokens do not support refresh')
			return null
		},

		async revokeToken(token: string): Promise<void> {
			try {
				await fetch(`https://api.github.com/applications/${clientId}/token`, {
					body: JSON.stringify({ access_token: token }),
					headers: {
						Accept: 'application/json',
						Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
						'Content-Type': 'application/json',
					},
					method: 'DELETE',
				})
			} catch (error) {
				logger.warn('GitHub token revocation failed', { error })
			}
		},
	}
}
