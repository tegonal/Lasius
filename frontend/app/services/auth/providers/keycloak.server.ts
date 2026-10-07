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

import { getServerEnvironmentRequired } from '~/lib/environment.server'

import { type OAuthProvider } from '../types'
import { createOAuth2Provider, fetchOidcUserProfile } from './oauth2-client.server'

export function createKeycloakProvider(): OAuthProvider {
  const baseUrl = `${getServerEnvironmentRequired('KEYCLOAK_OAUTH_URL')}/protocol/openid-connect`

  return createOAuth2Provider({
    authorizationUrl: `${baseUrl}/auth`,
    credentials: {
      clientId: getServerEnvironmentRequired('KEYCLOAK_OAUTH_CLIENT_ID'),
      clientSecret: getServerEnvironmentRequired('KEYCLOAK_OAUTH_CLIENT_SECRET'),
    },
    getUserProfile: (accessToken) =>
      fetchOidcUserProfile('Keycloak', `${baseUrl}/userinfo`, accessToken),
    label: 'Keycloak',
    provider: 'keycloak',
    revokeUrl: `${baseUrl}/revoke`,
    scope: 'openid profile email',
    tokenUrl: `${baseUrl}/token`,
  })
}
