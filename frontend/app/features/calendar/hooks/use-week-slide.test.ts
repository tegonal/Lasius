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

import { getWeekSlide } from '~/features/calendar/hooks/use-week-slide'
import { type IsoDateString } from '~/lib/utils/dates'

const week = (start: string) => [start] as IsoDateString[]

describe('getWeekSlide', () => {
  it('slides to the next week when the new week starts later', () => {
    expect(getWeekSlide(week('2026-10-12'), week('2026-10-19'))).toEqual({
      animationClass: 'animate-week-slide-next',
      direction: 'next',
      from: week('2026-10-12'),
    })
  })

  it('slides to the previous week when the new week starts earlier', () => {
    expect(getWeekSlide(week('2026-10-19'), week('2026-10-12'))?.direction).toBe('previous')
  })

  it('compares the dates across a year boundary', () => {
    expect(getWeekSlide(week('2026-12-28'), week('2027-01-04'))?.direction).toBe('next')
  })

  it('does not slide when the first day is the same or missing', () => {
    expect(getWeekSlide(week('2026-10-19'), week('2026-10-19'))).toBeUndefined()
    expect(getWeekSlide([], week('2026-10-19'))).toBeUndefined()
  })
})
