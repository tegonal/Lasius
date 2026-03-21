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
	isRouteErrorResponse,
	Links,
	type LinksFunction,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteError,
} from 'react-router'
import { useChangeLanguage } from 'remix-i18next/react'

import { localeCookie } from '~/lib/cookies/i18next-cookie.server'
import { logger } from '~/lib/logger'
import { getLocale, i18nextMiddleware } from '~/middleware/i18next'

import { type Route } from './+types/root.ts'
import './tailwind.css'

export const middleware = [i18nextMiddleware]

export const links: LinksFunction = () => [
	{ href: '/favicon.svg', rel: 'icon', type: 'image/svg+xml' },
]

export const handle = {
	i18n: ['common'],
}

export const loader = async ({ context }: Route.LoaderArgs) => {
	const locale = getLocale(context)

	const headers = new Headers()
	headers.append('Set-Cookie', await localeCookie.serialize(locale))

	return data({ locale }, { headers })
}

export default function App({ loaderData }: Route.ComponentProps) {
	useChangeLanguage(loaderData.locale)
	return <Outlet />
}

export function ErrorBoundary() {
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
								<a className="btn btn-primary" href="/login">
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
								<a className="btn btn-primary" href="/">
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
							<a className="btn btn-primary" href="/">
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
						<a className="btn btn-primary" href="/">
							Go home
						</a>
					</div>
				</div>
			</div>
		</div>
	)
}

export function Layout({ children }: PropsWithChildren) {
	const { i18n } = useTranslation()

	return (
		<html dir={i18n.dir(i18n.language)} lang={i18n.language}>
			<head>
				<meta charSet="utf-8" />
				<meta content="width=device-width, initial-scale=1" name="viewport" />
				<Links />
				<Meta />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}
