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

import { describe, expect, it } from 'vitest'

import { getErrorPage } from './error-page'

const response = (status: number, statusText: string, data: unknown) => ({
  data,
  internal: false,
  status,
  statusText,
})

describe('getErrorPage', () => {
  it('names the statuses with their own page', () => {
    expect(getErrorPage(response(401, 'Unauthorized', 'x'), false).kind).toBe('unauthorized')
    expect(getErrorPage(response(403, 'Forbidden', 'x'), false).kind).toBe('forbidden')
    expect(getErrorPage(response(404, 'Not Found', 'x'), false).kind).toBe('notFound')
  })

  it('gives the status, the status text and the data of another status', () => {
    expect(getErrorPage(response(500, 'Server Error', 'boom'), false)).toEqual({
      kind: 'status',
      message: 'boom',
      status: 500,
      statusText: 'Server Error',
    })
  })

  it('gives null for an empty status text and for missing data, but keeps empty data', () => {
    expect(getErrorPage(response(418, '', undefined), false)).toMatchObject({
      message: null,
      statusText: null,
    })
    expect(getErrorPage(response(400, '', ''), false)).toMatchObject({ message: '' })
  })

  it('shows the details of an Error only in development', () => {
    const error = new Error('boom')
    expect(getErrorPage(error, false)).toEqual({ details: null, kind: 'unexpected' })
    expect(getErrorPage(error, true)).toEqual({
      details: { message: 'boom', stack: error.stack },
      kind: 'unexpected',
    })
  })

  it('shows no details for a thrown value that is not an Error', () => {
    expect(getErrorPage('thrown text', true)).toEqual({ details: null, kind: 'unexpected' })
  })
})
