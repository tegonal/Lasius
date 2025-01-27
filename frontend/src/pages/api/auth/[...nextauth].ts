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
      accessToken: tokens.access_token,
    };
  },
};

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
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

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
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
        console.log('[NextAuth][session]', session, token);
        session.user = token.user;
        session.accessToken = token.accessToken;
        session.error = token.error;

        return session;
      },
      async jwt({ token, user, account, profile }) {
        console.log('[NextAuth][jwt][token]', token);
        console.log('[NextAuth][jwt][user]', user);
        console.log('[NextAuth][jwt][account]', account);
        console.log('[NextAuth][jwt][profile]', profile);
        // Initial sign in
        if (account && user) {
          return {
            accessToken: account.access_token,
            accessTokenExpires: Date.now() + account.expires_in * 1000,
            refreshToken: account.refresh_token,
            user,
          };
        }

        // Return previous token if the access token has not expired yet or has no expiration set
        if (!token.accessTokenExpires || Date.now() < token.accessTokenExpires) {
          return token;
        }

        // Access token has expired, try to update it
        return refreshAccessToken(token);
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
