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

import { createReadableStreamFromReadable } from '@react-router/node'
import { createInstance } from 'i18next'
import { isbot } from 'isbot'
import { PassThrough } from 'node:stream'
import {
  renderToPipeableStream,
  type RenderToPipeableStreamOptions,
} from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import {
  type EntryContext,
  isRouteErrorResponse,
  type RouterContextProvider,
  ServerRouter,
} from 'react-router'

import { i18nConfig } from '~/i18n-config'
import { logger } from '~/lib/logger'

import { getInstance } from './middleware/i18next'

export const streamTimeout = 5000

/**
 * Handle server-side errors for logging and reporting.
 * Filters out aborted requests and expected client errors.
 */
export function handleError(error: unknown, { request }: { request: Request }) {
  // Don't log aborted requests (user navigated away)
  if (request.signal.aborted) {
    return
  }

  // Don't log expected client errors (4xx responses)
  if (isRouteErrorResponse(error) && error.status < 500) {
    return
  }

  // Log server errors
  logger.error({ error, url: request.url }, 'Unhandled server error')
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  entryContext: EntryContext,
  routerContext: RouterContextProvider,
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false
    const userAgent = request.headers.get('user-agent')

    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || entryContext.isSpaMode
        ? 'onAllReady'
        : 'onShellReady'

    let i18nInstance: ReturnType<typeof createInstance>
    try {
      i18nInstance = getInstance(routerContext)
    } catch {
      // Middleware context unavailable for non-route requests (favicon, .well-known, etc.)
      // Fall back to a minimal synchronous i18n instance
      i18nInstance = createInstance({
        ...i18nConfig,
        initAsync: false,
        lng: i18nConfig.fallbackLng,
      })
      void i18nInstance.init()
    }

    const { abort, pipe } = renderToPipeableStream(
      <I18nextProvider i18n={i18nInstance}>
        <ServerRouter context={entryContext} url={request.url} />
      </I18nextProvider>,
      {
        onError(error: unknown) {
          responseStatusCode = 500
          if (shellRendered) logger.error(error)
        },
        onShellError(error: unknown) {
          reject(error)
        },
        [readyOption]() {
          shellRendered = true
          const body = new PassThrough()
          const stream = createReadableStreamFromReadable(body)

          responseHeaders.set('Content-Type', 'text/html')

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          )

          pipe(body)
        },
      },
    )

    setTimeout(abort, streamTimeout + 1000)
  })
}
