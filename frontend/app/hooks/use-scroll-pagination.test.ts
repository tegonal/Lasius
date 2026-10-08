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

import { getNextShownCount } from './use-scroll-pagination'

const near = { remainingScroll: 10, scrollBeforeEnd: 50, shown: 30, step: 30, total: 100 }

describe('getNextShownCount', () => {
  it('shows one more step near the end', () => {
    expect(getNextShownCount(near)).toBe(60)
  })

  it('stops at the total', () => {
    expect(getNextShownCount({ ...near, total: 45 })).toBe(45)
  })

  it('keeps the number far from the end or when all items show', () => {
    expect(getNextShownCount({ ...near, remainingScroll: 50 })).toBeNull()
    expect(getNextShownCount({ ...near, total: 30 })).toBeNull()
  })

  it('keeps the number for a step of 0', () => {
    expect(getNextShownCount({ ...near, step: 0 })).toBeNull()
  })
})
