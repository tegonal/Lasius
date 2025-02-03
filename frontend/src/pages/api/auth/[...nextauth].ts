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

import NextAuth, { JWT, NextAuthOptions } from 'next-auth';
import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from 'lib/logger';
import { OAuthConfig } from 'next-auth/providers';

const internalProvider: OAuthConfig<any> = {
  id: 'lasius-internal',
  name: 'Internal Lasius',
  version: '2.0',
  type: 'oauth',
  // redirect to local login page
  authorization: {
    url: 'http://localhost:3000/internal_oauth',
    params: {
      scope: 'profile openid email',
    },
  },
  token: 'http://localhost:3000/backend/oauth2/access_token',
  userinfo: 'http://localhost:3000/backend/oauth2/profile',
  clientId: process.env.LASIUS_OAUTH_CLIENT_ID,
  clientSecret: process.env.LASIUS_OAUTH_CLIENT_SECRET,
  checks: ['pkce', 'state'],
  idToken: false,
  profile(profile: any, tokens) {
    console.log('profile', profile, tokens);
    return {
      id: profile.id.toString(),
      name: profile.firstName + ' ' + profile.lastName,
      email: profile.email,
      access_token: tokens.access_token,
    };
  },
};

/**
 * Takes a token, and returns a new token with updated
 * `access_token` and `expires_at`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token) {
  try {
    // TODO: support other providers
    const url =
      'http://localhost:3000/backend/oauth2/access_token?' +
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      });

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: Buffer.from(
          'Basic ' +
            process.env.LASIUS_OAUTH_CLIENT_ID +
            ':' +
            process.env.LASIUS_OAUTH_CLIENT_SECRET,
          'binary'
        ).toString('base64'),
      },
      method: 'POST',
    });

    const tokensOrError = await response.json();

    if (!response.ok) {
      throw tokensOrError;
    }

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
      refresh_token: newTokens.refresh_token ? newTokens.refresh_token : token.refresh_token,
    };
  } catch (error) {
    console.log('[NextAuth][RefreshAccessTokenError]', error);

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

const nextAuthOptions = (): NextAuthOptions => {
  return {
    debug: true,
    providers: [internalProvider],
    session: {
      strategy: 'jwt',
    },
    jwt: {
      secret: process.env.NEXTAUTH_JWT_SECRET,
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
      signIn: '/login',
      signOut: '/',
    },
    callbacks: {
      async session({ session, token }) {
        session.user = token.user;
        session.access_token = token.access_token;
        session.error = token.error;

        return session;
      },
      async jwt({ token, account }) {
        // Initial sign in
        if (account) {
          // First-time login, save the `access_token`, its expiry and the `refresh_token`
          return {
            ...token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            refresh_token: account.refresh_token,
          };
        } else if (!token.expires_at || Date.now() < token.expires_at * 1000) {
          // Subsequent logins, but the `access_token` is still valid
          return token;
        } else {
          // Subsequent logins, but the `access_token` has expired, try to refresh it
          if (!token.refresh_token) throw new TypeError('Missing refresh_token');

          // Access token has expired, try to update it
          return refreshAccessToken(token);
        }
      },
    },
    events: {
      async signOut() {
        logger.info('[nextauth][events][signOut]');
      },
      async signIn() {
        logger.info('[nextauth][events][signIn]');
      },
    },
  };
};

// eslint-disable-next-line
export default (req: NextApiRequest, res: NextApiResponse) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return NextAuth(req, res, nextAuthOptions(req, res));
};
