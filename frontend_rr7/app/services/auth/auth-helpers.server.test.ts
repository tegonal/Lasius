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

import { describe, expect, it } from 'vitest'

import { authHeaders } from './auth-helpers.server'
import { type LasiusSessionData } from './types'

const mockSession: LasiusSessionData = {
	accessToken: 'test-access-token',
	email: 'test@example.com',
	expiresAt: Date.now() + 3600_000,
	refreshToken: 'test-refresh-token',
	tokenIssuer: 'keycloak',
	userId: 'user-123',
}

describe('authHeaders', () => {
	it('returns Authorization and X-Token-Issuer headers', () => {
		const headers = authHeaders(mockSession)
		expect(headers).toEqual({
			Authorization: 'Bearer test-access-token',
			'X-Token-Issuer': 'keycloak',
		})
	})

	it('uses the correct token issuer for internal provider', () => {
		const internalSession: LasiusSessionData = {
			...mockSession,
			tokenIssuer: 'internal',
		}
		const headers = authHeaders(internalSession)
		expect(headers['X-Token-Issuer']).toBe('internal')
	})
})
