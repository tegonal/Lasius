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

import { type ShouldRevalidateFunctionArgs } from 'react-router'
import { describe, expect, it } from 'vitest'

import { type ModelsBooking } from '~/services/api/lasius'

import {
  appendBookingPage,
  getBookingListFilter,
  getBookingListSignature,
  listShouldRevalidate,
} from './booking-list-query'

const TAGS = encodeURIComponent(
  JSON.stringify([
    { id: 'Billable', type: 'SimpleTag' },
    { id: 'a,b', type: 'SimpleTag' },
  ]),
)

describe('getBookingListFilter', () => {
  it('reads the project, the user and every tag id', () => {
    expect(
      getBookingListFilter(new URLSearchParams(`projectId=p1&userId=u1&tags=${TAGS}`)),
    ).toEqual({ projectId: 'p1', tagId: ['Billable', 'a,b'], userId: 'u1' })
  })

  it('treats an empty param as no filter', () => {
    expect(getBookingListFilter(new URLSearchParams('projectId=&userId=&tags='))).toEqual({
      projectId: undefined,
      tagId: [],
      userId: undefined,
    })
  })
})

describe('getBookingListSignature', () => {
  it('ignores a param that is not a filter', () => {
    expect(getBookingListSignature(new URLSearchParams('from=a&to=b&date=x'))).toBe(
      getBookingListSignature(new URLSearchParams('from=a&to=b&date=y')),
    )
  })

  it('changes with each filter', () => {
    const base = getBookingListSignature(new URLSearchParams('from=a&to=b'))
    for (const query of ['from=c&to=b', 'from=a&to=b&tags=x', 'from=a&to=b&projectId=p']) {
      expect(getBookingListSignature(new URLSearchParams(query))).not.toBe(base)
    }
  })
})

const shouldRerun = (overrides: Partial<ShouldRevalidateFunctionArgs>) =>
  listShouldRevalidate({
    currentParams: {},
    currentUrl: new URL('http://localhost/user/lists?from=a&to=b'),
    defaultShouldRevalidate: true,
    nextParams: {},
    nextUrl: new URL('http://localhost/user/lists?from=a&to=b&date=x'),
    ...overrides,
  })

describe('listShouldRevalidate', () => {
  it('skips a GET call through the proxy', () => {
    expect(
      shouldRerun({ formAction: '/api/proxy', formMethod: 'POST', json: { method: 'GET' } }),
    ).toBe(false)
  })

  it('reruns after a change through the proxy', () => {
    expect(
      shouldRerun({ formAction: '/api/proxy', formMethod: 'POST', json: { method: 'DELETE' } }),
    ).toBe(true)
  })

  it('reruns for a revalidation of the same URL', () => {
    const url = new URL('http://localhost/user/lists?from=a&to=b')
    expect(shouldRerun({ currentUrl: url, nextUrl: url })).toBe(true)
  })

  it('skips a change of a param that is not a filter, and reruns for a filter change', () => {
    expect(shouldRerun({})).toBe(false)
    expect(
      shouldRerun({ nextUrl: new URL('http://localhost/user/lists?from=a&to=b&userId=u') }),
    ).toBe(true)
  })
})

const BOOKING: ModelsBooking = {
  bookingHash: 0,
  id: '',
  organisationReference: { id: 'o', key: 'o' },
  projectReference: { id: 'p', key: 'p' },
  start: { dateTime: '2026-01-01T09:00:00.000', zone: 'UTC' },
  tags: [],
  userReference: { id: 'u', key: 'u' },
}

describe('appendBookingPage', () => {
  it('drops a booking that the loaded list holds already', () => {
    const booking = (id: string): ModelsBooking => ({ ...BOOKING, id })
    expect(
      appendBookingPage([booking('1'), booking('2')], [booking('2'), booking('3')]).map(
        (b) => b.id,
      ),
    ).toEqual(['1', '2', '3'])
  })
})
