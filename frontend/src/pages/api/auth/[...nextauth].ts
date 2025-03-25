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

import NextAuth, { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from 'lib/logger';
import { OAuthConfig } from 'next-auth/providers';
import {
  AUTH_PROVIDER_CUSTOMER_KEYCLOAK,
  AUTH_PROVIDER_INTERNAL_LASIUS,
} from 'projectConfig/constants';
import { t } from 'i18next';
import GitLab from 'next-auth/providers/gitlab';
import GitHub from 'next-auth/providers/github';
import Keyclaok from 'next-auth/providers/keycloak';
import { logout } from 'lib/api/lasius/oauth2-provider/oauth2-provider';
import { getRequestHeaders } from 'lib/api/hooks/useTokensWithAxiosRequests';

const gitlabUrl = process.env.GITLAB_OAUTH_URL || 'https://gitlab.com';
const githubUrl = 'https://api.github.com/';

const internalProvider: OAuthConfig<any> = {
  id: AUTH_PROVIDER_INTERNAL_LASIUS,
  // wrap into `t` to ensure we have a translation to it
  name: t('Internal Lasius Sign in') || 'Internal Lasius Sign in',
  version: '2.0',
  type: 'oauth',
  // redirect to local login page
  authorization: {
    url: process.env.NEXTAUTH_URL + '/internal_oauth/login',
    params: {
      scope: 'profile openid email',
    },
  },
  token: process.env.NEXTAUTH_URL + '/backend/oauth2/access_token',
  userinfo: process.env.NEXTAUTH_URL + '/backend/oauth2/profile',
  clientId: process.env.LASIUS_OAUTH_CLIENT_ID,
  clientSecret: process.env.LASIUS_OAUTH_CLIENT_SECRET,
  checks: ['pkce', 'state'],
  idToken: false,
  profile: async (profile: any) => {
    return {
      id: profile.id.toString(),
      name: profile.firstName + ' ' + profile.lastName,
      email: profile.email,
    };
  },
};

async function requestRefreshToken(refresh_token: string, provider?: string): Promise<any> {
  switch (provider) {
    case 'gitlab':
      return await fetch(gitlabUrl + '/oauth/access_token', {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refresh_token || '',
          client_id: process.env.GITLAB_OAUTH_CLIENT_ID || '',
          client_secret: process.env.GITLAB_OAUTH_CLIENT_SECRET || '',
        }),
      });
    case 'github':
      return await fetch(githubUrl + '/oauth/access_token', {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refresh_token || '',
          client_id: process.env.GITHUB_OAUTH_CLIENT_ID || '',
          client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET || '',
        }),
      });
    case AUTH_PROVIDER_CUSTOMER_KEYCLOAK:
      return await fetch(process.env.KEYCLOAK_OAUTH_URL + '/protocol/openid-connect/token', {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refresh_token || '',
          client_id: process.env.KEYCLOAK_OAUTH_CLIENT_ID || '',
          client_secret: process.env.KEYCLOAK_OAUTH_CLIENT_SECRET || '',
        }),
      });
    default:
      return await fetch(process.env.NEXTAUTH_URL + '/backend/oauth2/access_token', {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refresh_token || '',
          client_id: process.env.LASIUS_OAUTH_CLIENT_ID || '',
          client_secret: process.env.LASIUS_OAUTH_CLIENT_SECRET || '',
        }),
      });
  }
}

/**
 * Takes a token, and returns a new token with updated
 * `access_token` and `expires_at`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  console.debug('[NextAuth][refreshAccessToken]', token?.refresh_token);
  if (!token?.refresh_token) {
    return token;
  }
  try {
    const response = await requestRefreshToken(token.refresh_token, token.provider);

    const tokensOrError = await response.json();

    if (!response.ok) {
      throw tokensOrError;
    }

    console.info('[NextAuth][refreshAccessToken][RenewedToken]', tokensOrError?.refresh_token);

    const newTokens = tokensOrError as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    };

    return {
      ...token,
      access_token: newTokens.access_token,
      expires_at: Math.floor(Date.now() / 1000 + newTokens.expires_in),
      // Some providers only issue refresh tokens once, so preserve if we did not get a new one
      refresh_token: newTokens.refresh_token ?? token.refresh_token,
    };
  } catch (error) {
    console.log('[NextAuth][RefreshAccessTokenError]', error);

    token.error = 'RefreshAccessTokenError';
    return token;
  }
}
const providers = [];
if (process.env.LASIUS_OAUTH_CLIENT_ID && process.env.LASIUS_OAUTH_CLIENT_SECRET) {
  providers.push(internalProvider);
}
if (
  process.env.KEYCLOAK_OAUTH_CLIENT_ID &&
  process.env.KEYCLOAK_OAUTH_CLIENT_SECRET &&
  process.env.KEYCLOAK_OAUTH_URL
) {
  providers.push(
    Keyclaok({
      id: AUTH_PROVIDER_CUSTOMER_KEYCLOAK,
      name: process.env.KEYCLOAK_OAUTH_PROVIDER_NAME || 'Keycloak',
      clientId: process.env.KEYCLOAK_OAUTH_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_OAUTH_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_OAUTH_URL,
    })
  );
}
if (process.env.GITLAB_OAUTH_CLIENT_ID && process.env.GITLAB_OAUTH_CLIENT_SECRET) {
  providers.push(
    GitLab({
      clientId: process.env.GITLAB_OAUTH_CLIENT_ID,
      clientSecret: process.env.GITLAB_OAUTH_CLIENT_SECRET,
      wellKnown: gitlabUrl + '/.well-known/openid-configuration',
      authorization: { params: { scope: 'openid email profile' } },
      profile(profile) {
        return {
          id: (profile.id || profile.sub).toString(),
          name: profile.name ?? profile.username,
          email: profile.email,
          image: profile.avatar_url,
          access_token_issuer: gitlabUrl,
        };
      },
    })
  );
}
if (process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          access_token_issuer: githubUrl,
        };
      },
    })
  );
}

export const nextAuthOptions: NextAuthOptions = {
  debug: true,
  providers: providers,
  session: {
    strategy: 'jwt',
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    signOut: '/',
  },
  callbacks: {
    async session({ session, token, user }) {
      if (token) {
        session.user = token?.user;
        session.access_token = token.access_token;
        session.access_token_issuer = token.access_token_issuer;
        session.error = token?.error;
        session.provider = token.provider;
      }
      session.user = session.user || user;
      console.debug('[NextAuth][Session]', session);

      return session;
    },
    async jwt({ token, account, user, profile }) {
      // Initial sign in
      if (account) {
        // First-time login, save the `access_token`, its expiry and the `refresh_token`
        return {
          ...token,
          access_token: account.access_token,
          access_token_issuer: user?.access_token_issuer,
          expires_at: account.expires_at,
          refresh_token: account.refresh_token,
          user: user || {
            ...profile,
            access_token: account.access_token,
          },
          provider: account.provider,
        };
      } else if (!token.expires_at || Date.now() < token.expires_at * 1000) {
        // Subsequent logins, but the `access_token` is still valid
        return token;
      } else {
        // Subsequent logins, but the `access_token` has expired, try to refresh it
        if (!token.refresh_token) throw new TypeError('Missing refresh_token');
        if (token.error === 'RefreshAccessTokenError') {
          console.log('Token refresh already failed, not trying again.');
          return token;
        }

        // Access token has expired, try to update it
        return await refreshAccessToken(token);
      }
    },
  },
  events: {
    async signOut({ token }: { token: JWT }) {
      logger.info('[nextauth][events][signOut]', token.provider);
      // auto logout from keycloak instance
      if (token.provider === AUTH_PROVIDER_CUSTOMER_KEYCLOAK) {
        logger.info(
          'auto-logout from keycloak at',
          process.env.KEYCLOAK_OAUTH_URL + '/protocol/openid-connect/logout'
        );

        await fetch(process.env.KEYCLOAK_OAUTH_URL + '/protocol/openid-connect/logout', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token.access_token,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.KEYCLOAK_OAUTH_CLIENT_ID || '',
            client_secret: process.env.KEYCLOAK_OAUTH_CLIENT_SECRET || '',
            refresh_token: token.refresh_token || '',
          }),
        });
      }
      // or internal lasius provider
      else if (token.provider === AUTH_PROVIDER_INTERNAL_LASIUS) {
        await logout(getRequestHeaders(token.access_token, token.access_token_issuer));
      }
    },
    async signIn() {
      logger.info('[nextauth][events][signIn]');
    },
  },
};

// eslint-disable-next-line
export default (req: NextApiRequest, res: NextApiResponse) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return NextAuth(req, res, nextAuthOptions);
};
