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

import { dateOptions } from './date-options'
import { getListDateRange } from './list-date-range'

const now = new Date(2026, 8, 29, 14, 30)

describe('getListDateRange', () => {
  it('uses the from and to params when both are set', () => {
    const parameters = new URLSearchParams({ from: '2026-09-01', to: '2026-09-02' })

    expect(getListDateRange(parameters, now)).toEqual({ from: '2026-09-01', to: '2026-09-02' })
  })

  it('uses the range of the first date option when no param is set', () => {
    expect(getListDateRange(new URLSearchParams(), now)).toEqual(dateOptions[0]?.dateRangeFn(now))
  })

  it('ignores a from param without a to param', () => {
    const parameters = new URLSearchParams({ from: '2026-09-01' })

    expect(getListDateRange(parameters, now)).toEqual(dateOptions[0]?.dateRangeFn(now))
  })
})
