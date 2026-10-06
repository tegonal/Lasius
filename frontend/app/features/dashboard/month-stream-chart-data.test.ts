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

import { type ModelsBooking } from '~/services/api/lasius'

import { computeStreamChartData } from './month-stream-chart-data'

// The production container runs with TZ=Europe/Zurich.
process.env.TZ = 'Europe/Zurich'

const reference = { id: 'ref', key: 'ref' }

const booking = (start: string, end: string): ModelsBooking => ({
  bookingHash: 0,
  end: { dateTime: end, zone: 'Europe/Zurich' },
  id: start,
  organisationReference: reference,
  projectReference: reference,
  start: { dateTime: start, zone: 'Europe/Zurich' },
  tags: [],
  userReference: reference,
})

// March 2026 spans the ISO weeks 9 (Monday 23 February) to 14 (Monday 30 March).
const MARCH_WEEKS = ['Week 9', 'Week 10', 'Week 11', 'Week 12', 'Week 13', 'Week 14']
const MARCH = '2026-03-15'

describe('computeStreamChartData', () => {
  it('returns seven zero rows with every week of the month and no keys without bookings', () => {
    const { data, keys } = computeStreamChartData([], MARCH)
    expect(data).toHaveLength(7)
    for (const row of data) {
      expect(Object.keys(row)).toEqual(MARCH_WEEKS)
      expect(Object.values(row).every((value) => value === 0)).toBe(true)
    }
    expect(keys).toEqual([])
  })

  it('adds the hours of a booking to its weekday and week', () => {
    const { data, keys } = computeStreamChartData(
      [booking('2026-03-02T09:00:00.000', '2026-03-02T11:30:00.000')],
      MARCH,
    )
    expect(data[0]?.['Week 10']).toBe(2.5)
    expect(keys).toEqual(['Week 10'])
  })

  it('sums the per-booking hours, which getModelsBookingSummary rounds to two decimals', () => {
    // Two bookings of 20 minutes give 0.33 + 0.33, not 40 minutes as 0.67.
    const { data } = computeStreamChartData(
      [
        booking('2026-03-04T09:00:00.000', '2026-03-04T09:20:00.000'),
        booking('2026-03-04T10:00:00.000', '2026-03-04T10:20:00.000'),
      ],
      MARCH,
    )
    expect(data[2]?.['Week 10']).toBe(0.66)
  })

  it('puts a Sunday booking into the last row', () => {
    const { data } = computeStreamChartData(
      [booking('2026-03-01T09:00:00.000', '2026-03-01T10:00:00.000')],
      MARCH,
    )
    expect(data[6]?.['Week 9']).toBe(1)
  })

  it('ignores a booking in a week outside the month', () => {
    const { data, keys } = computeStreamChartData(
      [booking('2026-04-15T09:00:00.000', '2026-04-15T10:00:00.000')],
      MARCH,
    )
    expect(keys).toEqual([])
    expect(data.every((row) => !('Week 16' in row))).toBe(true)
  })

  it('lists the keys in calendar order', () => {
    const { keys } = computeStreamChartData(
      [
        booking('2026-03-02T09:00:00.000', '2026-03-02T10:00:00.000'),
        booking('2026-03-01T09:00:00.000', '2026-03-01T10:00:00.000'),
      ],
      MARCH,
    )
    expect(keys).toEqual(['Week 9', 'Week 10'])
  })

  it('keeps week 1 of the next year after the December weeks', () => {
    // Monday 28 December 2026 starts the week that holds 1 January 2027.
    const { keys } = computeStreamChartData(
      [
        booking('2026-12-29T09:00:00.000', '2026-12-29T10:00:00.000'),
        booking('2026-12-01T09:00:00.000', '2026-12-01T10:00:00.000'),
      ],
      '2026-12-15',
    )
    expect(keys).toEqual(['Week 49', 'Week 1'])
  })
})
