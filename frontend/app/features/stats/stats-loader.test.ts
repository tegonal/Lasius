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

import { type ShouldRevalidateFunctionArgs } from 'react-router'
import { describe, expect, it } from 'vitest'

import { projectStatsShouldRevalidate, statsShouldRevalidate } from './stats-loader'

const base = 'http://localhost/user/stats/project/p-1'

const navigation = (current: string, next: string): ShouldRevalidateFunctionArgs => {
  const currentUrl = new URL(`${base}${current}`)
  const nextUrl = new URL(`${base}${next}`)
  return {
    currentParams: {},
    currentUrl,
    defaultShouldRevalidate: true,
    nextParams: {},
    nextUrl,
  }
}

describe('statsShouldRevalidate', () => {
  it('skips the reload when the date range stays the same', () => {
    expect(statsShouldRevalidate(navigation('?from=a&to=b', '?from=a&to=b&view=users'))).toBe(false)
  })

  it('reloads when the date range changes', () => {
    expect(statsShouldRevalidate(navigation('?from=a&to=b', '?from=a&to=c'))).toBe(true)
  })
})

describe('projectStatsShouldRevalidate', () => {
  it('reloads when the view changes', () => {
    expect(
      projectStatsShouldRevalidate(navigation('?from=a&to=b', '?from=a&to=b&view=users')),
    ).toBe(true)
  })

  it('skips the reload when the view and the date range stay the same', () => {
    expect(
      projectStatsShouldRevalidate(
        navigation('?from=a&to=b&view=users', '?from=a&to=b&view=users'),
      ),
    ).toBe(false)
  })
})
