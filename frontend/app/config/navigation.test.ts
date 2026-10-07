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

import { Clock } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { AUTH_PROVIDER_INTERNAL_LASIUS, ROLES } from '~/config/constants'

import { getNavigation, type NavigationSection } from './navigation'

const route = (name: string, restrictTo?: string[]) => ({
  icon: Clock,
  name,
  route: `/${name}`,
  ...(restrictTo && { restrictTo }),
})

const navigation: NavigationSection[] = [
  {
    icon: Clock,
    level: 'settings',
    name: 'Settings',
    routes: [
      route('open'),
      route('admin', [ROLES.ORGANISATION_ADMIN]),
      route('internal', [AUTH_PROVIDER_INTERNAL_LASIUS]),
      route('either', [ROLES.ORGANISATION_ADMIN, AUTH_PROVIDER_INTERNAL_LASIUS]),
    ],
  },
]

const visibleNames = (
  isOrganisationAdministrator: boolean,
  isUserOfInternalOAuthProvider: boolean,
) =>
  getNavigation({
    id: 'settings',
    isOrganisationAdministrator,
    isUserOfInternalOAuthProvider,
    navigation,
  }).map((item) => item.name)

describe('getNavigation', () => {
  it('returns no routes for an unknown section', () => {
    expect(
      getNavigation({
        id: 'unknown',
        isOrganisationAdministrator: true,
        isUserOfInternalOAuthProvider: true,
        navigation,
      }),
    ).toEqual([])
  })

  it('shows only unrestricted routes to a user who is neither admin nor internal', () => {
    expect(visibleNames(false, false)).toEqual(['open'])
  })

  it('shows the admin routes to an organisation administrator', () => {
    expect(visibleNames(true, false)).toEqual(['open', 'admin', 'either'])
  })

  it('shows the internal provider routes to a user of the internal provider', () => {
    expect(visibleNames(false, true)).toEqual(['open', 'internal', 'either'])
  })

  it('shows every route to an administrator of the internal provider', () => {
    expect(visibleNames(true, true)).toEqual(['open', 'admin', 'internal', 'either'])
  })
})
