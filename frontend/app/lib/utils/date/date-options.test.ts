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

const t = (key: string, options: string | { defaultValue: string }) =>
  `${key}|${typeof options === 'string' ? options : options.defaultValue}`

describe('dateOptions', () => {
  it('keeps the stored English names', () => {
    expect(dateOptions.map((option) => option.name)).toEqual([
      'Yesterday',
      'This week',
      'This month',
      'This quarter',
      'This year',
      'Last week',
      'Last month',
      'Last quarter',
      'Last year',
      'Custom',
    ])
  })

  it('translates each label with a static key of the common namespace', () => {
    expect(dateOptions.map((option) => option.label(t))).toEqual([
      'common:time.yesterday|Yesterday',
      'common:time.thisWeek|This week',
      'common:time.thisMonth|This month',
      'common:time.thisQuarter|This quarter',
      'common:time.thisYear|This year',
      'common:time.lastWeek|Last week',
      'common:time.lastMonth|Last month',
      'common:time.lastQuarter|Last quarter',
      'common:time.lastYear|Last year',
      'common:custom|Custom',
    ])
  })
})
