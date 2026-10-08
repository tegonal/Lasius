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

import { Clock } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { getDatePickerLayout } from './date-picker-layout'

const preset = { presetDate: '2026-10-08T10:00', presetIcon: Clock, presetLabel: 'Use end' }

describe('getDatePickerLayout', () => {
  it('shows date, spacer and time, with the preset after the time', () => {
    expect(getDatePickerLayout({ ...preset, withDate: true, withTime: true })).toEqual({
      datePreset: null,
      showDate: true,
      showSpacer: true,
      showTime: true,
      timePreset: { icon: Clock, label: 'Use end' },
    })
  })

  it('puts the preset after the date without a time input', () => {
    const layout = getDatePickerLayout({ ...preset, withDate: true, withTime: false })
    expect(layout.datePreset).toEqual({ icon: Clock, label: 'Use end' })
    expect(layout.showSpacer).toBe(false)
    expect(layout.showTime).toBe(false)
  })

  it('shows only the time for a time-only picker', () => {
    const layout = getDatePickerLayout({ withDate: false, withTime: true })
    expect(layout).toEqual({
      datePreset: null,
      showDate: false,
      showSpacer: false,
      showTime: true,
      timePreset: null,
    })
  })

  it('needs a date, a label and an icon for a preset', () => {
    for (const missing of ['presetDate', 'presetIcon', 'presetLabel'] as const) {
      const layout = getDatePickerLayout({
        ...preset,
        [missing]: undefined,
        withDate: true,
        withTime: true,
      })
      expect(layout.timePreset).toBeNull()
    }
  })
})
