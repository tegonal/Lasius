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

import { toRoutePattern } from './route-pattern'

describe('toRoutePattern', () => {
  it('keeps a path without params', () => {
    expect(toRoutePattern('/user/home', {})).toBe('/user/home')
  })

  it('replaces a param value with its name', () => {
    expect(toRoutePattern('/join/0b6f2c1e-1234', { invitationId: '0b6f2c1e-1234' })).toBe(
      '/join/:invitationId',
    )
  })

  it('replaces a nested param and keeps the static segments', () => {
    expect(toRoutePattern('/user/stats/project/p1', { projectId: 'p1' })).toBe(
      '/user/stats/project/:projectId',
    )
  })

  it('matches an encoded segment against the decoded param value', () => {
    expect(toRoutePattern('/help/de/a%20b', { locale: 'de', slug: 'a b' })).toBe(
      '/help/:locale/:slug',
    )
  })

  it('replaces a splat value with a star', () => {
    expect(toRoutePattern('/api/auth/callback/keycloak', { '*': 'callback/keycloak' })).toBe(
      '/api/auth/*',
    )
  })

  it('keeps a malformed encoded segment', () => {
    expect(toRoutePattern('/user/%E0%A4%A', {})).toBe('/user/%E0%A4%A')
  })
})
