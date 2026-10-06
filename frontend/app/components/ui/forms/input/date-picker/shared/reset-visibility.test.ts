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

import { type ResetCheckValue, shouldShowResetButton } from './reset-visibility'

const initialDate = new Date('2026-10-06T08:00:00')
const laterDate = new Date('2026-10-06T09:00:00')

const value = (overrides: Partial<ResetCheckValue>): ResetCheckValue => ({
  date: initialDate,
  dateString: '06.10.2026',
  isPartial: false,
  isValid: true,
  timeString: '08:00',
  ...overrides,
})

describe('shouldShowResetButton', () => {
  it('hides the button while the value equals the initial value', () => {
    expect(shouldShowResetButton(initialDate, value({}))).toBe(false)
  })

  it('shows the button when a valid value differs from the initial value', () => {
    expect(shouldShowResetButton(initialDate, value({ date: laterDate }))).toBe(true)
  })

  it('hides the button for a valid value without an initial value', () => {
    expect(shouldShowResetButton(null, value({ date: laterDate }))).toBe(false)
  })

  it('shows the button for a complete but invalid input', () => {
    expect(
      shouldShowResetButton(
        initialDate,
        value({ date: null, dateString: '31.02.2026', isValid: false }),
      ),
    ).toBe(true)
  })

  it('hides the button while the input is partial', () => {
    expect(
      shouldShowResetButton(initialDate, value({ date: null, isPartial: true, isValid: false })),
    ).toBe(false)
  })

  it('hides the button for an empty invalid input', () => {
    expect(
      shouldShowResetButton(
        initialDate,
        value({ date: null, dateString: '', isValid: false, timeString: '' }),
      ),
    ).toBe(false)
  })
})
