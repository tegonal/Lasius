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
import { useChangeLanguage } from 'remix-i18next/react'

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

export default function App({ loaderData }: Route.ComponentProps) {
	useChangeLanguage(loaderData.locale)
	return <Outlet />
}

export const ErrorBoundary = () => {
	const error = useRouteError()

	// Log errors client-side only
	if (typeof window !== 'undefined') {
		logger.error('ErrorBoundary caught error', error)
	}

	if (isRouteErrorResponse(error)) {
		if (error.status === 401) {
			return (
				<div className="flex min-h-screen items-center justify-center p-4">
					<div className="card bg-base-200 w-full max-w-md shadow-lg">
						<div className="card-body items-center text-center">
							<h1 className="card-title text-2xl">Unauthorized</h1>
							<p>You need to sign in to access this page.</p>
							<div className="card-actions mt-4">
								<a className="btn btn-primary" href={href('/login')}>
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
							<h1 className="card-title text-2xl">Page not found</h1>
							<p>The page you are looking for does not exist.</p>
							<div className="card-actions mt-4">
								<a className="btn btn-primary" href={href('/')}>
									Go home
								</a>
							</div>
						</div>
					</div>
				</div>
			)
		}

		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<div className="card bg-base-200 w-full max-w-md shadow-lg">
					<div className="card-body">
						<h1 className="card-title text-2xl">
							{error.status} {error.statusText}
						</h1>
						<p>{error.data?.toString() ?? 'An error occurred.'}</p>
						<div className="card-actions mt-4">
							<a className="btn btn-primary" href={href('/')}>
								Go home
							</a>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="card bg-base-200 w-full max-w-md shadow-lg">
				<div className="card-body">
					<div className="alert alert-error mb-4">
						<span>An unexpected error occurred.</span>
					</div>
					{process.env.NODE_ENV === 'development' && error instanceof Error && (
						<details className="collapse-arrow bg-base-300 collapse">
							<summary className="collapse-title font-medium">
								Error details
							</summary>
							<div className="collapse-content">
								<p className="font-mono text-sm">{error.message}</p>
								{error.stack && (
									<pre className="mt-2 overflow-auto text-xs">
										{error.stack}
									</pre>
								)}
							</div>
						</details>
					)}
					<div className="card-actions mt-4">
						<a className="btn btn-primary" href={href('/')}>
							Go home
						</a>
					</div>
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
				<ToastProvider>{children}</ToastProvider>
				<ScrollRestoration />
				<Scripts />
				<HelpDrawer />
			</body>
		</html>
	)
}
