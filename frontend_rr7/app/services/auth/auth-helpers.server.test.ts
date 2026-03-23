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

import {
  authHeaders,
  type AuthResult,
  mergeAuthHeaders,
  sanitizeReturnTo,
} from './auth-helpers.server'
import { type LasiusSessionData } from './types'

const mockSession: LasiusSessionData = {
  accessToken: 'test-access-token',
  email: 'test@example.com',
  expiresAt: Date.now() + 3600_000,
  issuedAt: Date.now(),
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

describe('sanitizeReturnTo', () => {
  it('allows a valid relative path', () => {
    expect(sanitizeReturnTo('/dashboard')).toBe('/dashboard')
  })

  it('allows nested relative paths', () => {
    expect(sanitizeReturnTo('/org/123/projects')).toBe('/org/123/projects')
  })

  it('rejects empty string', () => {
    expect(sanitizeReturnTo('')).toBe('/')
  })

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeReturnTo('//evil.com')).toBe('/')
  })

  it('rejects absolute URLs', () => {
    expect(sanitizeReturnTo('https://evil.com')).toBe('/')
  })

  it('rejects paths not starting with /', () => {
    expect(sanitizeReturnTo('evil.com/path')).toBe('/')
  })

  it('rejects backslash paths', () => {
    expect(sanitizeReturnTo('/\\evil.com')).toBe('/')
  })

  it('rejects paths with embedded backslashes', () => {
    expect(sanitizeReturnTo('/foo\\bar')).toBe('/')
  })

  it('uses custom fallback', () => {
    expect(sanitizeReturnTo('', '/home')).toBe('/home')
  })
})

describe('mergeAuthHeaders', () => {
  it('returns empty headers when authResult has no headers', () => {
    const authResult: AuthResult = { session: mockSession }
    const merged = mergeAuthHeaders(authResult)
    expect(merged.get('Set-Cookie')).toBeNull()
  })

  it('propagates Set-Cookie from Headers instance', () => {
    const setCookieHeaders = new Headers({
      'Set-Cookie': 'session=abc123',
    })
    const authResult: AuthResult = {
      headers: setCookieHeaders,
      session: mockSession,
    }
    const merged = mergeAuthHeaders(authResult)
    expect(merged.get('Set-Cookie')).toBe('session=abc123')
  })

  it('propagates Set-Cookie from plain object', () => {
    const authResult: AuthResult = {
      headers: { 'Set-Cookie': 'session=abc123' },
      session: mockSession,
    }
    const merged = mergeAuthHeaders(authResult)
    expect(merged.get('Set-Cookie')).toBe('session=abc123')
  })

  it('preserves existing response headers', () => {
    const authResult: AuthResult = {
      headers: { 'Set-Cookie': 'session=abc123' },
      session: mockSession,
    }
    const merged = mergeAuthHeaders(authResult, {
      'Content-Type': 'application/json',
    })
    expect(merged.get('Content-Type')).toBe('application/json')
    expect(merged.get('Set-Cookie')).toBe('session=abc123')
  })
})
