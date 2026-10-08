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

import { isRouteErrorResponse } from 'react-router'

export type ErrorPage =
  | {
      details: null | { message: string; stack: null | string }
      kind: 'unexpected'
    }
  | {
      kind: StatusErrorKind
      /** The response data as text, or null. An empty text stays empty. */
      message: null | string
      status: number
      /** The status text, or null when it is empty. */
      statusText: null | string
    }

export type StatusErrorKind = 'forbidden' | 'notFound' | 'status' | 'unauthorized'

const KIND_BY_STATUS: Partial<Record<number, StatusErrorKind>> = {
  401: 'unauthorized',
  403: 'forbidden',
  404: 'notFound',
}

/** What the root error boundary shows. Only development shows the message and stack of an Error. */
export const getErrorPage = (error: unknown, isDevelopment: boolean): ErrorPage => {
  if (!isRouteErrorResponse(error)) {
    return {
      details:
        isDevelopment && error instanceof Error
          ? { message: error.message, stack: error.stack || null }
          : null,
      kind: 'unexpected',
    }
  }
  return {
    kind: KIND_BY_STATUS[error.status] ?? 'status',
    message: error.data?.toString() ?? null,
    status: error.status,
    statusText: error.statusText || null,
  }
}
