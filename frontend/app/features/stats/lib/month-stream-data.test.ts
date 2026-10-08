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

import { isValidMonthlyWeekStreamData, prepareMonthStreamData } from './month-stream-data'

const week = (rows: Record<string, number>[]) => [
  ...rows,
  ...Array.from({ length: 7 - rows.length }, () => ({})),
]

describe('isValidMonthlyWeekStreamData', () => {
  it('accepts seven rows of numbers of 0 or more', () => {
    expect(isValidMonthlyWeekStreamData(week([{ 'Week 41': 2 }]))).toBe(true)
  })

  it('rejects another row count, a negative value, a text value or a null row', () => {
    expect(isValidMonthlyWeekStreamData([{}])).toBe(false)
    expect(isValidMonthlyWeekStreamData(week([{ 'Week 41': -1 }]))).toBe(false)
    expect(isValidMonthlyWeekStreamData(week([{ 'Week 41': '2' as unknown as number }]))).toBe(
      false,
    )
    expect(isValidMonthlyWeekStreamData([null, {}, {}, {}, {}, {}, {}])).toBe(false)
    expect(isValidMonthlyWeekStreamData('rows')).toBe(false)
  })
})

describe('prepareMonthStreamData', () => {
  it('fills every key in every row with a number', () => {
    const prepared = prepareMonthStreamData(week([{ 'Week 41': 2.5 }, { 'Week 42': 1 }]), [
      'Week 41',
      'Week 42',
    ])
    expect(prepared?.keys).toEqual(['Week 41', 'Week 42'])
    expect(prepared?.data[0]).toEqual({ 'Week 41': 2.5, 'Week 42': 0 })
    expect(prepared?.data[1]).toEqual({ 'Week 41': 0, 'Week 42': 1 })
    expect(prepared?.data[6]).toEqual({ 'Week 41': 0, 'Week 42': 0 })
  })

  it('gives the empty state for invalid data, no keys or no hours', () => {
    expect(prepareMonthStreamData([{}], ['Week 41'])).toBeNull()
    expect(prepareMonthStreamData(week([{ 'Week 41': 2 }]), 'Week 41')).toBeNull()
    expect(prepareMonthStreamData(week([{ 'Week 41': 2 }]), [])).toBeNull()
    expect(prepareMonthStreamData(week([{ 'Week 41': 0 }]), ['Week 41'])).toBeNull()
  })
})
