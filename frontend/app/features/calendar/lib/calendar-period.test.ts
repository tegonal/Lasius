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

import { getMonthOfDate, getWeekOfDate } from '~/lib/utils/dates'

import { getPeriod, shiftByPeriod } from './calendar-period'

describe('getPeriod', () => {
  it('gives the month or the week of the date', () => {
    expect(getPeriod('2026-10-08', 'month')).toEqual(getMonthOfDate('2026-10-08'))
    expect(getPeriod('2026-10-08', 'week')).toEqual(getWeekOfDate('2026-10-08'))
  })
})

describe('shiftByPeriod', () => {
  const date = new Date(2026, 9, 8)

  it('moves by months in the month view', () => {
    expect(shiftByPeriod(date, 'month', 1)).toEqual(new Date(2026, 10, 8))
    expect(shiftByPeriod(date, 'month', -1)).toEqual(new Date(2026, 8, 8))
  })

  it('moves by weeks in the week view', () => {
    expect(shiftByPeriod(date, 'week', 1)).toEqual(new Date(2026, 9, 15))
    expect(shiftByPeriod(date, 'week', -1)).toEqual(new Date(2026, 9, 1))
  })
})
