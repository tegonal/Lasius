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
  internalLoginUrl,
  internalRegisterUrl,
  loginUrl,
  logoutUrl,
  providerLoginUrl,
} from './auth-urls'

describe('loginUrl', () => {
  it('returns base path with no params', () => {
    expect(loginUrl()).toContain('/login')
    expect(loginUrl()).not.toContain('?')
  })

  it('includes returnTo param', () => {
    const url = loginUrl({ returnTo: '/dashboard' })
    expect(url).toContain('returnTo=%2Fdashboard')
  })

  it('includes error param', () => {
    const url = loginUrl({ error: 'token_exchange_failed' })
    expect(url).toContain('error=token_exchange_failed')
  })

  it('omits empty string params', () => {
    const url = loginUrl({ error: '', returnTo: '' })
    expect(url).not.toContain('?')
  })

  it('omits undefined params', () => {
    const url = loginUrl({ returnTo: undefined })
    expect(url).not.toContain('?')
  })
})

describe('internalLoginUrl', () => {
  it('returns base path with no params', () => {
    expect(internalLoginUrl()).toContain('/internal-oauth/login')
    expect(internalLoginUrl()).not.toContain('?')
  })

  it('includes all params when provided', () => {
    const url = internalLoginUrl({
      email: 'test@example.com',
      invitation_id: 'inv-123',
      registered: true,
      returnTo: '/join/inv-123',
    })
    expect(url).toContain('email=test%40example.com')
    expect(url).toContain('invitation_id=inv-123')
    expect(url).toContain('registered=true')
    expect(url).toContain('returnTo=%2Fjoin%2Finv-123')
  })

  it('omits registered when false', () => {
    const url = internalLoginUrl({ registered: false })
    expect(url).not.toContain('registered')
  })

  it('omits empty strings', () => {
    const url = internalLoginUrl({
      email: '',
      invitation_id: '',
      returnTo: '/home',
    })
    expect(url).not.toContain('email=')
    expect(url).not.toContain('invitation_id=')
    expect(url).toContain('returnTo')
  })
})

describe('internalRegisterUrl', () => {
  it('returns base path with no params', () => {
    expect(internalRegisterUrl()).toContain('/internal-oauth/register')
    expect(internalRegisterUrl()).not.toContain('?')
  })

  it('includes invitation_id and returnTo', () => {
    const url = internalRegisterUrl({
      invitation_id: 'inv-123',
      returnTo: '/join/inv-123',
    })
    expect(url).toContain('invitation_id=inv-123')
    expect(url).toContain('returnTo=%2Fjoin%2Finv-123')
  })
})

describe('providerLoginUrl', () => {
  it('routes internal provider to /internal-oauth/login', () => {
    const url = providerLoginUrl('internal', { returnTo: '/' })
    expect(url).toContain('/internal-oauth/login')
  })

  it('routes github provider to /oauth/github/login', () => {
    const url = providerLoginUrl('github', { returnTo: '/' })
    expect(url).toContain('/oauth/github/login')
  })

  it('routes keycloak provider to /oauth/keycloak/login', () => {
    const url = providerLoginUrl('keycloak', { returnTo: '/' })
    expect(url).toContain('/oauth/keycloak/login')
  })

  it('includes email for internal provider', () => {
    const url = providerLoginUrl('internal', {
      email: 'test@example.com',
      returnTo: '/',
    })
    expect(url).toContain('email=test%40example.com')
  })

  it('strips email for external provider', () => {
    const url = providerLoginUrl('github', {
      email: 'test@example.com',
      returnTo: '/',
    })
    expect(url).not.toContain('email')
  })

  it('strips invitation_id for external provider', () => {
    const url = providerLoginUrl('github', {
      invitation_id: 'inv-123',
      returnTo: '/join/inv-123',
    })
    expect(url).not.toContain('invitation_id')
    expect(url).toContain('returnTo')
  })

  it('includes invitation_id for internal provider', () => {
    const url = providerLoginUrl('internal', {
      invitation_id: 'inv-123',
      returnTo: '/join/inv-123',
    })
    expect(url).toContain('invitation_id=inv-123')
  })
})

describe('logoutUrl', () => {
  it('returns logout path', () => {
    expect(logoutUrl()).toContain('/logout')
  })
})
