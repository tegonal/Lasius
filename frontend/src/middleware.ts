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
import { JWT } from 'next-auth/jwt';
import { getToken } from 'next-auth/jwt';
import { NextAuthMiddlewareOptions, NextRequestWithAuth } from 'next-auth/middleware';
import { NextMiddlewareResult } from 'next/dist/server/web/types';
import { NextRequest, NextResponse } from 'next/server';

const withAuthMiddleware = async (request: NextRequestWithAuth) => {
  if (process.env.LASIUS_DEBUG) {
    console.debug('[Middleware][Request]', request.url, request.nextauth.token);
  }

  //
  // This middleware implements a workaround as next-auth has some issues storing the
  // updated token in the session-cookie after refreshing it.
  // Therefore we:
  //  1. Manually refresh the session in case the token expired before executing the request
  //  2. Set the newly fetched cookie on the initial request
  //  3. Return the refreshed cookie to the response as Set-Cookie header to store it in the client
  //
  let setCookies: string[] = [];
  const requestHeaders = request.headers;
  if (
    request.nextauth.token?.expires_at &&
    Date.now() >= request.nextauth.token.expires_at * 1000
  ) {
    if (process.env.LASIUS_DEBUG) {
      console.debug('[Middleware][AccessTokenExpired]');
    }
    const session = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/session`, {
      headers: {
        'content-type': 'application/json',
        cookie: request.cookies.toString(),
      },
    } satisfies RequestInit);
    const json = await session.json();
    const data = Object.keys(json).length > 0 ? json : null;

    if (process.env.LASIUS_DEBUG) {
      console.debug('[Middleware][AccessTokenChanged]', data);
    }
    setCookies = session.headers.getSetCookie();

    // use cookie already for queued request
    if (setCookies.length > 0) {
      setCookies.forEach((cookie) => {
        const [cookieName, cookieValue] = cookie.split('=');
        const setCookieValues = cookieValue.split(';');
        request.cookies.set(cookieName, setCookieValues[0]);
      });
      requestHeaders.set('Cookie', request.cookies.toString());
      if (process.env.LASIUS_DEBUG) {
        console.debug('[Middleware][UpgradedCookies]', request.cookies);
      }
    }
  }

  const res = NextResponse.next({
    headers: requestHeaders,
  });

  // forward set-cookies header from previous session-renew request
  if (setCookies.length > 0) {
    setCookies.forEach((cookie) => {
      res.headers.append('Set-Cookie', cookie);
    });
    if (process.env.LASIUS_DEBUG) {
      console.debug('[Middleware][Response][SetCookies]', setCookies);
    }
  }

  return res;
};

/** Copied from next-auth */
function parseUrl(url?: string): string {
  const defaultUrl = new URL('http://localhost:3000/api/auth');

  if (url && !url.startsWith('http')) {
    url = `https://${url}`;
  }

  const _url = new URL(url ?? defaultUrl);
  return (
    (_url.pathname === '/' ? defaultUrl.pathname : _url.pathname)
      // Remove trailing slash
      .replace(/\/$/, '')
  );
}

// Slightly adjusted impplementation of next-auth to support locale
async function handleAuthMiddleware(
  req: NextRequest,
  options: NextAuthMiddlewareOptions | undefined,
  onSuccess?: (token: JWT | null) => Promise<NextMiddlewareResult>
) {
  const { pathname, search, origin, basePath, locale, defaultLocale } = req.nextUrl;

  const signInPage = options?.pages?.signIn ?? '/api/auth/signin';
  const errorPage = options?.pages?.error ?? '/api/auth/error';
  const authPath = parseUrl(process.env.NEXTAUTH_URL);
  const publicPaths = ['/_next', '/favicon.ico'];

  // Avoid infinite redirects/invalid response
  // on paths that never require authentication
  if (
    `${basePath}${pathname}`.startsWith(authPath) ||
    [signInPage, errorPage].includes(pathname) ||
    publicPaths.some((p) => pathname.startsWith(p))
  ) {
    return;
  }

  const secret = options?.secret ?? process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) {
    console.error(`[next-auth][error][NO_SECRET]`, `\nhttps://next-auth.js.org/errors#no_secret`);

    const errorUrl = new URL(`${basePath}${errorPage}`, origin);
    errorUrl.searchParams.append('error', 'Configuration');

    return NextResponse.redirect(errorUrl);
  }

  const token = await getToken({
    req,
    decode: options?.jwt?.decode,
    cookieName: options?.cookies?.sessionToken?.name,
    secret,
  });

  const isAuthorized = (await options?.callbacks?.authorized?.({ req, token })) ?? !!token;

  // the user is authorized, let the middleware handle the rest
  if (isAuthorized) return await onSuccess?.(token);

  // append local to urls if not default locale
  const localePath = locale !== defaultLocale ? `/${locale}` : '';
  const localQueryParam = locale !== defaultLocale ? `?locale=${locale}` : '';

  // the user is not logged in, redirect to the sign-in page
  const signInUrl = new URL(`${basePath}${signInPage}${localQueryParam}`, origin);
  signInUrl.searchParams.append('callbackUrl', `${basePath}${localePath}${pathname}${search}`);
  return NextResponse.redirect(signInUrl);
}

export async function middleware(request: NextRequest) {
  return await handleAuthMiddleware(request, undefined, async (token) => {
    return withAuthMiddleware({
      ...request,
      nextauth: {
        token,
      },
    } as NextRequestWithAuth);
  });
}

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
