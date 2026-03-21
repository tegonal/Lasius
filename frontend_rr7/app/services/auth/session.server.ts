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

import { createCookieSessionStorage, redirect } from 'react-router'

import { logger } from '~/lib/logger'

import { getProvider } from './providers'
import { type LasiusSessionData } from './types'

export type { LasiusSessionData }

const sessionStorage = createCookieSessionStorage<{ user: LasiusSessionData }>({
	cookie: {
		httpOnly: true,
		maxAge: 60 * 60 * 24 * 7, // 7 days
		name: '_lasius_session',
		path: '/',
		sameSite: 'lax',
		secrets: [process.env.NEXTAUTH_SECRET!],
		secure: process.env.NODE_ENV === 'production',
	},
})

const { commitSession, destroySession, getSession } = sessionStorage

/** Create a new user session and redirect */
export async function createUserSession(
	data: LasiusSessionData,
	redirectTo: string,
): Promise<Response> {
	const session = await sessionStorage.getSession()
	session.set('user', data)

	return redirect(redirectTo, {
		headers: {
			'Set-Cookie': await commitSession(session),
		},
	})
}

/** Destroy the user session and redirect to login */
export async function destroyUserSession(
	request: Request,
	redirectTo = '/login',
): Promise<Response> {
	const session = await getUserSession(request)

	return redirect(redirectTo, {
		headers: {
			'Set-Cookie': await destroySession(session),
		},
	})
}

/**
 * Read session tokens, auto-refreshing if expired (60s buffer).
 * Returns tokens + optional Set-Cookie header if refreshed, or null if no valid session.
 */
export async function getSessionTokens(
	request: Request,
): Promise<null | { headers?: HeadersInit; tokens: LasiusSessionData }> {
	const session = await getUserSession(request)
	const user = session.get('user')

	if (!user) {
		return null
	}

	// Check if token is expired (with 60s buffer for clock skew)
	if (user.expiresAt < Date.now() + 60_000) {
		logger.debug('Access token expired, attempting refresh')

		try {
			const provider = getProvider(user.tokenIssuer)
			const refreshed = await provider.refreshToken(user.refreshToken)

			if (refreshed) {
				logger.debug('Token refresh successful')

				const updatedUser: LasiusSessionData = {
					...user,
					accessToken: refreshed.access_token,
					expiresAt: Date.now() + refreshed.expires_in * 1000,
					refreshToken: refreshed.refresh_token ?? user.refreshToken,
				}

				session.set('user', updatedUser)
				const setCookie = await commitSession(session)

				return {
					headers: { 'Set-Cookie': setCookie },
					tokens: updatedUser,
				}
			}
		} catch (error) {
			logger.warn('Token refresh failed, user needs to re-login', error)
		}

		return null
	}

	return { tokens: user }
}

/** Read user session from the request cookie */
export async function getUserSession(request: Request) {
	return getSession(request.headers.get('Cookie'))
}

/** Update session tokens (e.g., after a refresh) and return the Set-Cookie header */
export async function setSessionTokens(
	request: Request,
	tokens: LasiusSessionData,
): Promise<string> {
	const session = await getUserSession(request)
	session.set('user', tokens)
	return await commitSession(session)
}
