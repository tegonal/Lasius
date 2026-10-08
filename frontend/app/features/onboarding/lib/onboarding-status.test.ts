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

import { hasPlannedWorkingHours } from './onboarding-status'

const week = (hours: Partial<Record<string, number>>) => ({
  friday: 0,
  monday: 0,
  saturday: 0,
  sunday: 0,
  thursday: 0,
  tuesday: 0,
  wednesday: 0,
  ...hours,
})

describe('hasPlannedWorkingHours', () => {
  it('is false without planned hours', () => {
    expect(hasPlannedWorkingHours(undefined)).toBe(false)
    expect(hasPlannedWorkingHours(null)).toBe(false)
    expect(hasPlannedWorkingHours(week({}))).toBe(false)
  })

  it('is true when any weekday has hours', () => {
    expect(hasPlannedWorkingHours(week({ sunday: 0.5 }))).toBe(true)
    expect(hasPlannedWorkingHours(week({ monday: 8, tuesday: 8 }))).toBe(true)
  })
})
