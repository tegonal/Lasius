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

import { ArrowDownToLine } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsCurrentUserTimeBooking } from '~/services/api/lasius'

import { getRunningBookingDefaults, getStartPreset } from './running-booking-form'

const booking = {
  id: 'b1',
  projectReference: { id: 'p1', key: 'project' },
  start: { dateTime: '2026-10-08T14:40:00.000', zone: 'Europe/Zurich' },
  tags: [{ id: 't1', type: 'SimpleTag' }],
} as unknown as ModelsCurrentUserTimeBooking['booking']

describe('getRunningBookingDefaults', () => {
  it('fills the project, the start and the tags of the booking', () => {
    expect(getRunningBookingDefaults(booking)).toEqual({
      projectId: 'p1',
      start: formatISOLocale(new Date('2026-10-08T14:40:00.000')),
      tags: JSON.stringify([{ id: 't1', type: 'SimpleTag' }]),
    })
  })

  it('keeps every field empty without a booking', () => {
    expect(getRunningBookingDefaults(undefined)).toEqual({ projectId: '', start: '', tags: '' })
  })
})

describe('getStartPreset', () => {
  it('starts one second after the end of the latest booking', () => {
    expect(
      getStartPreset({ end: { dateTime: '2026-10-08T12:00:00.000' } }, 'Use end time'),
    ).toEqual({
      presetDate: formatISOLocale(new Date('2026-10-08T12:00:01.000')),
      presetIcon: ArrowDownToLine,
      presetLabel: 'Use end time',
    })
  })

  it('gives no preset without a latest booking or without its end', () => {
    expect(getStartPreset(null, 'Use end time')).toEqual({})
    expect(getStartPreset(undefined, 'Use end time')).toEqual({})
    expect(getStartPreset({}, 'Use end time')).toEqual({})
  })
})
