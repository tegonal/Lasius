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

import { getServerEnvironment, getServerEnvironmentRequired } from '~/lib/environment.server'

import { type OAuthProvider } from '../types'
import { createOAuth2Provider, fetchOidcUserProfile } from './oauth2-client.server'

export function createGitLabProvider(): OAuthProvider {
  const baseUrl = getServerEnvironment('GITLAB_OAUTH_URL', 'https://gitlab.com')!

  return createOAuth2Provider({
    authorizationUrl: `${baseUrl}/oauth/authorize`,
    credentials: {
      clientId: getServerEnvironmentRequired('GITLAB_OAUTH_CLIENT_ID'),
      clientSecret: getServerEnvironmentRequired('GITLAB_OAUTH_CLIENT_SECRET'),
    },
    // The OIDC userinfo endpoint works with the `openid` scope; `/api/v4/user` needs `read_user`.
    getUserProfile: (accessToken) =>
      fetchOidcUserProfile('GitLab', `${baseUrl}/oauth/userinfo`, accessToken),
    label: 'GitLab',
    provider: 'gitlab',
    revokeUrl: `${baseUrl}/oauth/revoke`,
    scope: 'openid email',
    tokenUrl: `${baseUrl}/oauth/token`,
  })
}
