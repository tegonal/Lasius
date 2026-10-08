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

import type React from 'react'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DATE_SEGMENT_CONFIG, type DateSegment } from '../core/segment-config'
import {
  getSegmentKeyAction,
  handleSegmentKeyDown,
  type SegmentKeyDownContext,
} from './segment-key-down'

const segments: DateSegment[] = ['day', 'month', 'year']
// Bounds for "15.03.2026": day=0-2, month=3-5, year=6-10
const bounds = {
  day: { end: 2, start: 0 },
  month: { end: 5, start: 3 },
  year: { end: 10, start: 6 },
}

describe('getSegmentKeyAction', () => {
  it('steps on ArrowUp and ArrowDown, also without a segment', () => {
    expect(getSegmentKeyAction('ArrowUp', false, 1, 'day', bounds, segments)).toEqual({
      direction: 1,
      kind: 'step',
    })
    expect(getSegmentKeyAction('ArrowDown', false, null, null, bounds, segments)).toEqual({
      direction: -1,
      kind: 'step',
    })
  })

  it('selects the next and the previous segment with Tab and Shift+Tab', () => {
    expect(getSegmentKeyAction('Tab', false, 0, 'day', bounds, segments)).toEqual({
      kind: 'select',
      target: 'month',
    })
    expect(getSegmentKeyAction('Tab', true, 3, 'month', bounds, segments)).toEqual({
      kind: 'select',
      target: 'day',
    })
  })

  it('leaves Tab to the browser at the first and the last segment', () => {
    expect(getSegmentKeyAction('Tab', false, 6, 'year', bounds, segments)).toBeNull()
    expect(getSegmentKeyAction('Tab', true, 0, 'day', bounds, segments)).toBeNull()
  })

  it('selects with ArrowLeft and ArrowRight only at a segment boundary', () => {
    expect(getSegmentKeyAction('ArrowRight', false, 2, 'day', bounds, segments)).toEqual({
      kind: 'select',
      target: 'month',
    })
    expect(getSegmentKeyAction('ArrowLeft', false, 3, 'month', bounds, segments)).toEqual({
      kind: 'select',
      target: 'day',
    })
    expect(getSegmentKeyAction('ArrowRight', false, 1, 'day', bounds, segments)).toBeNull()
    expect(getSegmentKeyAction('ArrowLeft', false, 0, 'day', bounds, segments)).toBeNull()
    expect(getSegmentKeyAction('ArrowRight', false, undefined, 'day', bounds, segments)).toBeNull()
  })

  it('ignores navigation without a segment and any other key', () => {
    expect(getSegmentKeyAction('Tab', false, 0, null, bounds, segments)).toBeNull()
    expect(getSegmentKeyAction('1', false, 0, 'day', bounds, segments)).toBeNull()
  })
})

describe('handleSegmentKeyDown', () => {
  const keyEvent = (key: string) => {
    const event = { key, preventDefault: vi.fn(), shiftKey: false, stopPropagation: vi.fn() }
    return event as unknown as React.KeyboardEvent<HTMLInputElement> & typeof event
  }

  const contextFor = (selectionStart: number, selectionEnd = selectionStart) => {
    const context = {
      config: DATE_SEGMENT_CONFIG,
      inputRef: { current: { blur: vi.fn(), selectionEnd, selectionStart } },
      inputValue: '15.03.2026',
      resetToInitial: vi.fn(),
      selectSegment: vi.fn(),
      setInputValue: vi.fn(),
      stepSegment: vi.fn(),
      updateFromString: vi.fn(),
    }
    return context as unknown as SegmentKeyDownContext<DateSegment> & typeof context
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('steps the segment at the caret', () => {
    const event = keyEvent('ArrowUp')
    const context = contextFor(4)
    handleSegmentKeyDown(event, context)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(context.stepSegment).toHaveBeenCalledWith('month', 1)
  })

  it('selects the next segment on Tab and leaves the last Tab to the browser', () => {
    const tab = keyEvent('Tab')
    const atDay = contextFor(0, 2)
    handleSegmentKeyDown(tab, atDay)
    expect(atDay.selectSegment).toHaveBeenCalledWith('month')

    const lastTab = keyEvent('Tab')
    const atYear = contextFor(6, 10)
    handleSegmentKeyDown(lastTab, atYear)
    expect(lastTab.preventDefault).not.toHaveBeenCalled()
    expect(atYear.selectSegment).not.toHaveBeenCalled()
  })

  it('blocks an invalid character and leaves a digit to the input', () => {
    const letter = keyEvent('a')
    handleSegmentKeyDown(letter, contextFor(0, 2))
    expect(letter.preventDefault).toHaveBeenCalled()

    const digit = keyEvent('1')
    const context = contextFor(0, 2)
    handleSegmentKeyDown(digit, context)
    expect(digit.preventDefault).not.toHaveBeenCalled()
    expect(context.stepSegment).not.toHaveBeenCalled()
  })

  it('resets on Escape before any other handling', () => {
    const event = keyEvent('Escape')
    const context = contextFor(0, 2)
    handleSegmentKeyDown(event, context)
    expect(context.resetToInitial).toHaveBeenCalled()
    expect(event.stopPropagation).toHaveBeenCalled()
  })

  it('clears a fully selected segment on Backspace', () => {
    const context = contextFor(3, 5)
    handleSegmentKeyDown(keyEvent('Backspace'), context)
    expect(context.setInputValue).toHaveBeenCalledWith('15.__.2026')
    expect(context.updateFromString).toHaveBeenCalledWith('15.__.2026')
    vi.runAllTimers()
    expect(context.selectSegment).toHaveBeenCalledWith('month')
  })

  it('moves to the next segment on the separator key', () => {
    const context = contextFor(0, 2)
    handleSegmentKeyDown(keyEvent('.'), context)
    expect(context.selectSegment).toHaveBeenCalledWith('month')
    expect(context.stepSegment).not.toHaveBeenCalled()
  })

  it('does nothing for a value without segments', () => {
    const event = keyEvent('ArrowUp')
    const context = { ...contextFor(0), inputValue: '' }
    handleSegmentKeyDown(event, context)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(context.stepSegment).not.toHaveBeenCalled()
  })
})
