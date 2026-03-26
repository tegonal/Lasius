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

import { type PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import {
  data,
  href,
  isRouteErrorResponse,
  Links,
  type LinksFunction,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  type ShouldRevalidateFunctionArgs,
  useRouteError,
  useRouteLoaderData,
} from 'react-router'

import { DataLoadingProgress } from '~/components/features/system/data-loading-progress'
import { ToastProvider } from '~/components/ui/feedback/toasts'
import { HelpDrawer } from '~/features/help/components/help-drawer'
import { localeCookie } from '~/lib/cookies/i18next-cookie.server'
import { parseThemeCookie } from '~/lib/cookies/theme-cookie.server'
import { logger } from '~/lib/logger'
import { getLocale, i18nextMiddleware } from '~/middleware/i18next'

import { type Route } from './+types/root.ts'
import './tailwind.css'

export const middleware = [i18nextMiddleware]

/** Locale and theme rarely change — skip revalidation unless navigation target changes */
export const shouldRevalidate = ({
  currentUrl,
  defaultShouldRevalidate,
  nextUrl,
}: ShouldRevalidateFunctionArgs) => {
  if (currentUrl.pathname === nextUrl.pathname) {
    return false
  }
  return defaultShouldRevalidate
}

export const links: LinksFunction = () => [
  { href: '/icons/lasius.svg', rel: 'icon', type: 'image/svg+xml' },
  { href: '/icon-96x96.png', rel: 'icon', sizes: '96x96', type: 'image/png' },
  { href: '/icon-32x32.png', rel: 'icon', sizes: '32x32', type: 'image/png' },
  { href: '/icon-16x16.png', rel: 'icon', sizes: '16x16', type: 'image/png' },
  {
    href: '/icon-192x192.png',
    rel: 'apple-touch-icon',
    sizes: '192x192',
  },
]

export const handle = {
  i18n: 'common',
}

export const loader = async ({ context, request }: Route.LoaderArgs) => {
  const locale = getLocale(context)

  const cookieHeader = request.headers.get('Cookie')
  const theme = parseThemeCookie(cookieHeader) ?? 'light'

  const headers = new Headers()
  headers.append('Set-Cookie', await localeCookie.serialize(locale))

  return data({ locale, theme }, { headers })
}

export default function App({ loaderData: _loaderData }: Route.ComponentProps) {
  return <Outlet />
}

const ErrorActions = ({ showTryAgain = true }: { showTryAgain?: boolean }) => (
  <div className="card-actions mt-6 justify-center gap-3">
    {showTryAgain && (
      <button
        className="btn btn-outline btn-sm"
        onClick={() => globalThis.window?.location.reload()}
        type="button"
      >
        Try again
      </button>
    )}
    <a className="btn btn-primary btn-sm" href={href('/')}>
      Go home
    </a>
  </div>
)

export const ErrorBoundary = () => {
  const error = useRouteError()

  // Log errors client-side only
  if (globalThis.window !== undefined) {
    logger.error('ErrorBoundary caught error', error)
  }

  if (isRouteErrorResponse(error)) {
    if (error.status === 401) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="card bg-base-200 w-full max-w-md shadow-lg">
            <div className="card-body items-center text-center">
              <div className="text-base-content/30 text-6xl font-black">
                401
              </div>
              <h1 className="card-title mt-2 text-xl">Unauthorized</h1>
              <p className="text-base-content/60 text-sm">
                You need to sign in to access this page.
              </p>
              <div className="card-actions mt-6">
                <a className="btn btn-primary btn-sm" href={href('/login')}>
                  Sign in
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (error.status === 404) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="card bg-base-200 w-full max-w-md shadow-lg">
            <div className="card-body items-center text-center">
              <div className="text-base-content/30 text-6xl font-black">
                404
              </div>
              <h1 className="card-title mt-2 text-xl">Page not found</h1>
              <p className="text-base-content/60 text-sm">
                The page you are looking for does not exist.
              </p>
              <ErrorActions showTryAgain={false} />
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="card bg-base-200 w-full max-w-md shadow-lg">
          <div className="card-body items-center text-center">
            <div className="text-base-content/30 text-6xl font-black">
              {error.status}
            </div>
            <h1 className="card-title mt-2 text-xl">
              {error.statusText || 'Something went wrong'}
            </h1>
            <p className="text-base-content/60 text-sm">
              {error.data?.toString() ?? 'An error occurred.'}
            </p>
            <ErrorActions />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-lg shadow-lg">
        <div className="card-body items-center text-center">
          <div className="text-error/30 text-6xl font-black">!</div>
          <h1 className="card-title mt-2 text-xl">Unexpected error</h1>
          <p className="text-base-content/60 text-sm">
            Something went wrong. Please try again or return to the home page.
          </p>
          {process.env.NODE_ENV === 'development' && error instanceof Error && (
            <details className="collapse-arrow bg-base-300 collapse mt-4 w-full text-left">
              <summary className="collapse-title text-sm font-medium">
                Error details
              </summary>
              <div className="collapse-content">
                <p className="text-error font-mono text-sm">{error.message}</p>
                {error.stack && (
                  <pre className="bg-base-100 mt-2 overflow-auto rounded-lg p-3 text-xs">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
          <ErrorActions />
        </div>
      </div>
    </div>
  )
}

/**
 * Inline script that runs before first paint to prevent FOUC.
 * 1. Reads the `theme` cookie (not httpOnly, so JS can access it)
 * 2. If no cookie, detects system preference and writes the cookie
 * 3. Sets data-theme on <html> — overrides the server default ('light')
 *    with the actual system preference on first visit
 *
 * The server always renders data-theme="light"|"dark" (from cookie, defaulting
 * to "light"). This script corrects to system preference before paint if needed,
 * and sets the cookie so the server gets it right on the next request.
 */
const themeInitScript = `
(function() {
  try {
    var theme = null;
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var c = cookies[i].trim();
      if (c.indexOf('theme=') === 0) {
        theme = decodeURIComponent(c.substring(6));
        break;
      }
    }
    if (theme !== 'light' && theme !== 'dark') {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ? 'dark'
        : 'light';
      document.cookie = 'theme=' + theme + ';path=/;max-age=31536000;samesite=lax' + (location.protocol === 'https:' ? ';secure' : '');
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`

export const Layout = ({ children }: PropsWithChildren) => {
  const { i18n } = useTranslation()
  const rootData = useRouteLoaderData<typeof loader>('root')
  const theme = rootData?.theme ?? 'light'

  return (
    <html
      data-theme={theme}
      dir={i18n.dir(i18n.language)}
      lang={i18n.language}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta content="dark light" name="color-scheme" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Links />
        <Meta />
      </head>
      <body>
        <DataLoadingProgress />
        <ToastProvider>{children}</ToastProvider>
        <ScrollRestoration />
        <Scripts />
        <HelpDrawer />
      </body>
    </html>
  )
}
