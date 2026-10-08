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

import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsBooking } from '~/services/api/lasius'

import { getAdjustedBookingBody } from './booking-adjust'

const local = (dateTime: string) => formatISOLocale(new Date(dateTime))

const reference = { id: 'x', key: 'x' }
const booking: ModelsBooking = {
  bookingHash: 1,
  end: { dateTime: '2026-10-08T12:00:00.000', zone: 'Europe/Zurich' },
  id: 'b1',
  organisationReference: reference,
  projectReference: { id: 'p1', key: 'Project' },
  start: { dateTime: '2026-10-08T10:00:00.000', zone: 'Europe/Zurich' },
  tags: [],
  userReference: reference,
}

describe('getAdjustedBookingBody', () => {
  it('moves the start and keeps the end, the project and the tags', () => {
    expect(getAdjustedBookingBody(booking, { start: '2026-10-08T10:30:00.000' })).toEqual({
      end: local('2026-10-08T12:00:00.000'),
      projectId: 'p1',
      start: local('2026-10-08T10:30:00.000'),
      tags: [],
    })
  })

  it('moves the end and keeps the start', () => {
    expect(getAdjustedBookingBody(booking, { end: '2026-10-08T11:15:00.000' })).toMatchObject({
      end: local('2026-10-08T11:15:00.000'),
      start: local('2026-10-08T10:00:00.000'),
    })
  })

  it('keeps no end for a running booking', () => {
    expect(getAdjustedBookingBody({ ...booking, end: null }, {}).end).toBeUndefined()
  })
})
