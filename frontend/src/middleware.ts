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

// eslint-disable-next-line no-restricted-exports
import { encode } from 'next-auth/jwt';
import { NextRequestWithAuth, withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  /*async (request: NextRequestWithAuth) => {
    console.log('Process request, token', request.nextauth.token);
    const res = NextResponse.next();
    const session = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/session`, {
      headers: {
        'content-type': 'application/json',
        cookie: request.cookies.toString(),
      },
    } satisfies RequestInit);
    const json = await session.json();
    const data = Object.keys(json).length > 0 ? json : null;
    console.log('Session response', data);

    // workaround due to multple issues in next-auth
    // update session cookie with new refresh and access_token
    const sessionCookie = process.env.NEXTAUTH_URL?.startsWith('https://')
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';
    const newSessionToken = await encode({
      secret: process.env.NEXTAUTH_SECRET || '',
      token: {
        ...request.nextauth.token,
        user: data.user,
        access_token: data.user.access_token,
        refresh_token: data.user.refresh_token,
      },
      maxAge: 30 * 24 * 60 * 60, // 30 days, or get the previous token's exp
    });

    // update session token with new access token
    //res.cookies.set(sessionCookie, newSessionToken);

    return res;
  },*/
  {
    pages: {
      signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

export const config = {
  //  Require authentication for the following routes
  matcher: [
    '/user',
    '/user/(.*)',
    '/organisation',
    '/organisation/(.*)',
    '/project',
    '/project/(.*)',
    '/projects',
    '/projects/(.*)',
    '/settings',
    '/settings/(.*)',
  ],
};
