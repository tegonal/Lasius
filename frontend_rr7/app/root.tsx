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
import {
  isRouteErrorResponse,
  Links,
  type LinksFunction,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'

import './tailwind.css'

export const links: LinksFunction = () => [
  { href: '/favicon.svg', rel: 'icon', type: 'image/svg+xml' },
]

export function Layout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
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

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let title = 'Unexpected Error'
  let message = 'An unexpected error occurred.'

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`
    message = error.data?.toString() ?? message
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h1 className="card-title text-2xl">{title}</h1>
          <p>{message}</p>
        </div>
      </div>
    </div>
  )
}
