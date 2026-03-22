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

export type AuthProvider = 'github' | 'gitlab' | 'internal' | 'keycloak'

export interface LasiusSessionData {
	accessToken: string
	email: string
	expiresAt: number // ms timestamp (Date.now())
	issuedAt: number // ms timestamp — when the token was issued or last refreshed
	refreshToken: string
	tokenIssuer: AuthProvider
	userId: string
}

/** Provider interface — each provider implements these */
export interface OAuthProvider {
	exchangeCode(
		code: string,
		redirectUri: string,
		codeVerifier?: string,
	): Promise<TokenResponse>
	getAuthorizationUrl(
		state: string,
		redirectUri: string,
		codeChallenge?: string,
	): string
	getUserProfile(
		accessToken: string,
	): Promise<{ email: string; userId: string }>
	provider: AuthProvider
	refreshToken(refreshToken: string): Promise<null | TokenResponse>
	revokeToken(token: string): Promise<void>
}

export interface TokenResponse {
	access_token: string
	expires_in: number
	refresh_token?: string
	scope?: string
	token_type: string
}
