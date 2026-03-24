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

import { describe, expect, it, vi } from 'vitest'

import {
  handleBackspaceDelete,
  handleEscapeKey,
  handleSeparatorKey,
} from './keyboard-handlers'

type DateSegment = 'day' | 'month' | 'year'

const segmentNames: DateSegment[] = ['day', 'month', 'year']
const delimiter = '.'
const inputValue = '24.03.2026'

// Bounds for "24.03.2026": day=0-2, month=3-5, year=6-10
const bounds = {
  day: { end: 2, start: 0 },
  month: { end: 5, start: 3 },
  year: { end: 10, start: 6 },
}

const placeholders: Record<DateSegment, string> = {
  day: '__',
  month: '__',
  year: '____',
}

function createMockEvent(
  key: string,
  overrides?: { selectionEnd?: number; selectionStart?: number },
) {
  return {
    key,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as any
}

function createMockInputRef(overrides?: {
  blur?: () => void
  selectionEnd?: number
  selectionStart?: number
}) {
  return {
    current: {
      blur: overrides?.blur ?? vi.fn(),
      selectionEnd: overrides?.selectionEnd ?? 0,
      selectionStart: overrides?.selectionStart ?? 0,
    },
  } as any
}

describe('handleEscapeKey', () => {
  it('calls preventDefault, stopPropagation, resetToInitial, and blur on Escape', () => {
    const blur = vi.fn()
    const e = createMockEvent('Escape')
    const inputRef = createMockInputRef({ blur })
    const resetToInitial = vi.fn()

    const result = handleEscapeKey(e, inputRef, resetToInitial)

    expect(result).toBe(true)
    expect(e.preventDefault).toHaveBeenCalled()
    expect(e.stopPropagation).toHaveBeenCalled()
    expect(resetToInitial).toHaveBeenCalled()
    expect(blur).toHaveBeenCalled()
  })

  it('returns false and does nothing for non-Escape key', () => {
    const blur = vi.fn()
    const e = createMockEvent('Enter')
    const inputRef = createMockInputRef({ blur })
    const resetToInitial = vi.fn()

    const result = handleEscapeKey(e, inputRef, resetToInitial)

    expect(result).toBe(false)
    expect(e.preventDefault).not.toHaveBeenCalled()
    expect(e.stopPropagation).not.toHaveBeenCalled()
    expect(resetToInitial).not.toHaveBeenCalled()
    expect(blur).not.toHaveBeenCalled()
  })
})

describe('handleSeparatorKey', () => {
  const separatorKeys = ['.', ',']

  it('advances to next segment when "." is pressed', () => {
    const e = createMockEvent('.')
    const inputRef = createMockInputRef({ selectionStart: 1 }) // inside 'day'
    const selectSegmentFn = vi.fn()

    const result = handleSeparatorKey(
      e,
      separatorKeys,
      inputRef,
      inputValue,
      delimiter,
      segmentNames,
      selectSegmentFn,
    )

    expect(result).toBe(true)
    expect(e.preventDefault).toHaveBeenCalled()
    expect(selectSegmentFn).toHaveBeenCalledWith('month')
  })

  it('advances to next segment when "," is pressed', () => {
    const e = createMockEvent(',')
    const inputRef = createMockInputRef({ selectionStart: 1 })
    const selectSegmentFn = vi.fn()

    const result = handleSeparatorKey(
      e,
      separatorKeys,
      inputRef,
      inputValue,
      delimiter,
      segmentNames,
      selectSegmentFn,
    )

    expect(result).toBe(true)
    expect(e.preventDefault).toHaveBeenCalled()
    expect(selectSegmentFn).toHaveBeenCalledWith('month')
  })

  it('returns false for non-separator key', () => {
    const e = createMockEvent('a')
    const inputRef = createMockInputRef({ selectionStart: 1 })
    const selectSegmentFn = vi.fn()

    const result = handleSeparatorKey(
      e,
      separatorKeys,
      inputRef,
      inputValue,
      delimiter,
      segmentNames,
      selectSegmentFn,
    )

    expect(result).toBe(false)
    expect(e.preventDefault).not.toHaveBeenCalled()
    expect(selectSegmentFn).not.toHaveBeenCalled()
  })

  it('returns true but does not advance when at last segment', () => {
    const e = createMockEvent('.')
    const inputRef = createMockInputRef({ selectionStart: 8 }) // inside 'year'
    const selectSegmentFn = vi.fn()

    const result = handleSeparatorKey(
      e,
      separatorKeys,
      inputRef,
      inputValue,
      delimiter,
      segmentNames,
      selectSegmentFn,
    )

    expect(result).toBe(true)
    expect(e.preventDefault).toHaveBeenCalled()
    expect(selectSegmentFn).not.toHaveBeenCalled()
  })

  it('advances from first segment to second', () => {
    const e = createMockEvent('.')
    const inputRef = createMockInputRef({ selectionStart: 0 }) // start of 'day'
    const selectSegmentFn = vi.fn()

    const result = handleSeparatorKey(
      e,
      separatorKeys,
      inputRef,
      inputValue,
      delimiter,
      segmentNames,
      selectSegmentFn,
    )

    expect(result).toBe(true)
    expect(selectSegmentFn).toHaveBeenCalledWith('month')
  })
})

describe('handleBackspaceDelete', () => {
  it('replaces day segment with placeholder when entire segment is selected', () => {
    vi.useFakeTimers()

    const e = createMockEvent('Backspace')
    const inputRef = createMockInputRef({
      selectionEnd: 2,
      selectionStart: 0,
    })
    const setInputValue = vi.fn()
    const updateStore = vi.fn()
    const selectSegmentFn = vi.fn()

    const result = handleBackspaceDelete(
      e,
      inputRef,
      inputValue,
      delimiter,
      segmentNames,
      bounds,
      placeholders,
      setInputValue,
      updateStore,
      selectSegmentFn,
    )

    expect(result).toBe(true)
    expect(e.preventDefault).toHaveBeenCalled()
    expect(setInputValue).toHaveBeenCalledWith('__.03.2026')
    expect(updateStore).toHaveBeenCalledWith('__.03.2026')

    vi.runAllTimers()
    expect(selectSegmentFn).toHaveBeenCalledWith('day')

    vi.useRealTimers()
  })

  it('returns false when segment is not fully selected (partial selection)', () => {
    const e = createMockEvent('Backspace')
    const inputRef = createMockInputRef({
      selectionEnd: 1,
      selectionStart: 0,
    })
    const setInputValue = vi.fn()
    const updateStore = vi.fn()
    const selectSegmentFn = vi.fn()

    const result = handleBackspaceDelete(
      e,
      inputRef,
      inputValue,
      delimiter,
      segmentNames,
      bounds,
      placeholders,
      setInputValue,
      updateStore,
      selectSegmentFn,
    )

    expect(result).toBe(false)
    expect(setInputValue).not.toHaveBeenCalled()
    expect(updateStore).not.toHaveBeenCalled()
  })

  it('handles Delete key same as Backspace', () => {
    vi.useFakeTimers()

    const e = createMockEvent('Delete')
    const inputRef = createMockInputRef({
      selectionEnd: 5,
      selectionStart: 3,
    })
    const setInputValue = vi.fn()
    const updateStore = vi.fn()
    const selectSegmentFn = vi.fn()

    const result = handleBackspaceDelete(
      e,
      inputRef,
      inputValue,
      delimiter,
      segmentNames,
      bounds,
      placeholders,
      setInputValue,
      updateStore,
      selectSegmentFn,
    )

    expect(result).toBe(true)
    expect(setInputValue).toHaveBeenCalledWith('24.__.2026')
    expect(updateStore).toHaveBeenCalledWith('24.__.2026')

    vi.runAllTimers()
    expect(selectSegmentFn).toHaveBeenCalledWith('month')

    vi.useRealTimers()
  })

  it('returns false for non-Backspace/Delete key', () => {
    const e = createMockEvent('a')
    const inputRef = createMockInputRef({
      selectionEnd: 2,
      selectionStart: 0,
    })
    const setInputValue = vi.fn()
    const updateStore = vi.fn()
    const selectSegmentFn = vi.fn()

    const result = handleBackspaceDelete(
      e,
      inputRef,
      inputValue,
      delimiter,
      segmentNames,
      bounds,
      placeholders,
      setInputValue,
      updateStore,
      selectSegmentFn,
    )

    expect(result).toBe(false)
    expect(setInputValue).not.toHaveBeenCalled()
  })

  it('returns false when selectionStart is null', () => {
    const e = createMockEvent('Backspace')
    const inputRef = {
      current: {
        selectionEnd: null,
        selectionStart: null,
      },
    } as any
    const setInputValue = vi.fn()
    const updateStore = vi.fn()
    const selectSegmentFn = vi.fn()

    const result = handleBackspaceDelete(
      e,
      inputRef,
      inputValue,
      delimiter,
      segmentNames,
      bounds,
      placeholders,
      setInputValue,
      updateStore,
      selectSegmentFn,
    )

    expect(result).toBe(false)
    expect(setInputValue).not.toHaveBeenCalled()
  })
})
