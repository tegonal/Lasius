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

import {
  buildBookingSubmit,
  computeAutoAdjustedEnd,
  computeDurationHours,
  computeInitialValues,
  getPresetEndReference,
  getPresetStartReference,
  isWithinSameMinute,
} from '~/features/bookings/lib/booking-form-logic'
import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsBooking } from '~/services/api/lasius'

const local = (y: number, m: number, d: number, h = 0, min = 0) =>
  formatISOLocale(new Date(y, m - 1, d, h, min))

// The API type carries more fields than the helpers read, so the fixture casts a partial shape.
const booking = (start: string, end?: string): ModelsBooking => {
  const value: object = {
    end: end ? { dateTime: end } : undefined,
    id: 'b1',
    projectReference: { id: 'p1', key: 'Lasius' },
    start: { dateTime: start },
    tags: [{ id: 't1', type: 'SimpleTag' }],
  }
  return value as ModelsBooking
}

const now = new Date(2026, 9, 7, 10, 30)

describe('isWithinSameMinute', () => {
  it('is true for times less than a minute apart and false otherwise', () => {
    expect(isWithinSameMinute(local(2026, 10, 7, 9, 0), local(2026, 10, 7, 9, 0))).toBe(true)
    expect(isWithinSameMinute(local(2026, 10, 7, 9, 0), local(2026, 10, 7, 9, 1))).toBe(false)
    expect(isWithinSameMinute('', local(2026, 10, 7, 9, 0))).toBe(false)
  })
})

describe('computeInitialValues', () => {
  it('copies an edited booking', () => {
    const values = computeInitialValues(
      'update',
      now,
      now,
      booking(local(2026, 10, 7, 8), local(2026, 10, 7, 9)),
    )
    expect(values).toEqual({
      end: local(2026, 10, 7, 9),
      projectId: 'p1',
      start: local(2026, 10, 7, 8),
      tags: '[{"id":"t1","type":"SimpleTag"}]',
    })
  })

  it('adds today from an hour ago until now', () => {
    expect(computeInitialValues('add', now, now)).toEqual({
      end: formatISOLocale(now),
      projectId: '',
      start: local(2026, 10, 7, 9, 30),
      tags: '',
    })
  })

  it('adds on another day from 08:00 to 12:00', () => {
    const values = computeInitialValues('add', new Date(2026, 9, 5, 15), now)
    expect(values.start.startsWith('2026-10-05T08:00')).toBe(true)
    expect(values.end.startsWith('2026-10-05T12:00')).toBe(true)
  })

  it('adds after a reference booking for one hour', () => {
    const reference = booking(local(2026, 10, 7, 8), local(2026, 10, 7, 9))
    const values = computeInitialValues('add', now, now, undefined, reference)
    expect(values.start).toBe(local(2026, 10, 7, 9))
    expect(values.end).toBe(local(2026, 10, 7, 10))
  })

  it('fills the gap between two bookings', () => {
    const next = booking(local(2026, 10, 7, 11), local(2026, 10, 7, 12))
    const before = booking(local(2026, 10, 7, 8), local(2026, 10, 7, 9))
    const values = computeInitialValues('addBetween', now, now, undefined, next, before)
    expect(values.start).toBe(local(2026, 10, 7, 9))
    expect(values.end).toBe(local(2026, 10, 7, 11))
  })

  it('gives empty values for an insert without a reference', () => {
    expect(computeInitialValues('addBetween', now, now)).toEqual({
      end: '',
      projectId: '',
      start: '',
      tags: '',
    })
  })
})

describe('computeDurationHours', () => {
  it('gives the hours between start and end, or 0 without both', () => {
    expect(computeDurationHours(local(2026, 10, 7, 8), local(2026, 10, 7, 17, 30))).toBe(9.5)
    expect(computeDurationHours('', local(2026, 10, 7, 9))).toBe(0)
  })
})

describe('computeAutoAdjustedEnd', () => {
  const end = local(2026, 10, 7, 12, 15)

  it('moves the end to the day of the new start and keeps its time', () => {
    expect(
      computeAutoAdjustedEnd({
        end,
        previousStart: local(2026, 10, 7, 8),
        start: local(2026, 10, 5, 9),
        trackedEnd: end,
      }),
    ).toBe(local(2026, 10, 5, 12, 15))
  })

  it('changes nothing when the start did not change or the end was edited', () => {
    const start = local(2026, 10, 5, 9)
    expect(computeAutoAdjustedEnd({ end, previousStart: start, start, trackedEnd: end })).toBeNull()
    expect(
      computeAutoAdjustedEnd({ end, previousStart: undefined, start, trackedEnd: 'other' }),
    ).toBeNull()
    expect(
      computeAutoAdjustedEnd({ end, previousStart: start, start: '', trackedEnd: end }),
    ).toBeNull()
  })
})

describe('preset references', () => {
  const latest = booking(local(2026, 10, 7, 8), local(2026, 10, 7, 9))

  it('offers the end of the latest booking as the start of a new one', () => {
    expect(
      getPresetStartReference({
        latestBooking: latest,
        mode: 'add',
        start: local(2026, 10, 7, 10),
      }),
    ).toEqual({ date: local(2026, 10, 7, 9), kind: 'latest' })
  })

  it('offers the end of the previous booking in update mode', () => {
    expect(
      getPresetStartReference({
        bookingBefore: latest,
        mode: 'update',
        start: local(2026, 10, 7, 10),
      })?.kind,
    ).toBe('previous')
  })

  it('offers no start preset for an insert, without a reference, or when it is already set', () => {
    expect(
      getPresetStartReference({ latestBooking: latest, mode: 'addBetween', start: '' }),
    ).toBeNull()
    expect(getPresetStartReference({ mode: 'add', start: '' })).toBeNull()
    expect(
      getPresetStartReference({ latestBooking: latest, mode: 'add', start: local(2026, 10, 7, 9) }),
    ).toBeNull()
  })

  it('offers the start of the next booking as an end only in update mode', () => {
    const next = booking(local(2026, 10, 7, 11))
    expect(
      getPresetEndReference({ bookingAfter: next, end: local(2026, 10, 7, 10), mode: 'update' }),
    ).toEqual({ date: local(2026, 10, 7, 11), kind: 'next' })
    expect(
      getPresetEndReference({ bookingAfter: next, end: local(2026, 10, 7, 10), mode: 'add' }),
    ).toBeNull()
    expect(
      getPresetEndReference({ bookingAfter: next, end: local(2026, 10, 7, 11), mode: 'update' }),
    ).toBeNull()
  })
})

describe('buildBookingSubmit', () => {
  const value = { end: 'e', projectId: 'p1', start: 's', tags: [] }

  it('adds in add and insert mode', () => {
    expect(buildBookingSubmit('add', value)?.kind).toBe('add')
    expect(buildBookingSubmit('addBetween', value)?.kind).toBe('add')
  })

  it('updates the edited booking and sends an empty time as undefined', () => {
    expect(buildBookingSubmit('update', { ...value, end: '' }, booking('s'))).toEqual({
      body: { end: undefined, projectId: 'p1', start: 's', tags: [] },
      bookingId: 'b1',
      kind: 'update',
    })
  })

  it('sends nothing without a project or without an edited booking', () => {
    expect(buildBookingSubmit('add', { ...value, projectId: '' })).toBeNull()
    expect(buildBookingSubmit('update', value)).toBeNull()
  })
})
