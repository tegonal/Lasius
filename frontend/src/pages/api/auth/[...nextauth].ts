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
import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from 'lib/logger';
import { OAuthConfig } from 'next-auth/providers';

const internalProvider: OAuthConfig<any> = {
  id: 'lasius-internal',
  name: 'Internal Lasius',
  version: '2.0',
  type: 'oauth',
  // redirect to local login page
  authorization: 'http://localhost:3000/internal_oauth',
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
        if (token) {
          session.accessToken = token.accessToken;
        }
        return {
          ...session,

          user: { ...session.user, image: undefined },
        };
      },
      async jwt({ token, user }) {
        // the user object is what returned from the Credentials login, it has `accessToken` from the server `/login` endpoint
        // assign the accessToken to the `token` object, so it will be available on the `session` callback
        if (user) {
          token.accessToken = user.accessToken;
        }
        return token;
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
