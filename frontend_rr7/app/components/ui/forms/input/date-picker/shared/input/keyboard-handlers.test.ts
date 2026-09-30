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
  didHandleBackspaceDelete,
  didHandleEscapeKey,
  didHandleSeparatorKey,
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

type MockInputElement = Pick<HTMLInputElement, 'blur' | 'selectionEnd' | 'selectionStart'>
// The handlers read only these members. A Node test cannot build a React event or a DOM element.
// The helpers below widen these typed partial mocks to the parameter types of the handlers.
type MockKeyboardEvent = Pick<
  React.KeyboardEvent<HTMLInputElement>,
  'key' | 'preventDefault' | 'stopPropagation'
>

function createMockEvent(
  key: string,
  _overrides?: { selectionEnd?: number; selectionStart?: number },
) {
  const event: MockKeyboardEvent = {
    key,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }
  return event as React.KeyboardEvent<HTMLInputElement>
}

function createMockInputReference(overrides?: {
  blur?: () => void
  selectionEnd?: number
  selectionStart?: number
}) {
  return toInputReference({
    blur: overrides?.blur ?? vi.fn(),
    selectionEnd: overrides?.selectionEnd ?? 0,
    selectionStart: overrides?.selectionStart ?? 0,
  })
}

function toInputReference(element: MockInputElement): React.RefObject<HTMLInputElement | null> {
  return { current: element as HTMLInputElement }
}

describe('didHandleEscapeKey', () => {
  it('calls preventDefault, stopPropagation, resetToInitial, and blur on Escape', () => {
    const blur = vi.fn()
    const event = createMockEvent('Escape')
    const inputReference = createMockInputReference({ blur })
    const resetToInitial = vi.fn()

    const isResult = didHandleEscapeKey(event, inputReference, resetToInitial)

    expect(isResult).toBe(true)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.stopPropagation).toHaveBeenCalled()
    expect(resetToInitial).toHaveBeenCalled()
    expect(blur).toHaveBeenCalled()
  })

  it('returns false and does nothing for non-Escape key', () => {
    const blur = vi.fn()
    const event = createMockEvent('Enter')
    const inputReference = createMockInputReference({ blur })
    const resetToInitial = vi.fn()

    const isResult = didHandleEscapeKey(event, inputReference, resetToInitial)

    expect(isResult).toBe(false)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(event.stopPropagation).not.toHaveBeenCalled()
    expect(resetToInitial).not.toHaveBeenCalled()
    expect(blur).not.toHaveBeenCalled()
  })
})

describe('didHandleSeparatorKey', () => {
  const separatorKeys = ['.', ',']

  it('advances to next segment when "." is pressed', () => {
    const event = createMockEvent('.')
    const inputReference = createMockInputReference({ selectionStart: 1 }) // inside 'day'
    const selectSegmentFunction = vi.fn()

    const isResult = didHandleSeparatorKey(
      event,
      separatorKeys,
      inputReference,
      inputValue,
      delimiter,
      segmentNames,
      selectSegmentFunction,
    )

    expect(isResult).toBe(true)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(selectSegmentFunction).toHaveBeenCalledWith('month')
  })

  it('advances to next segment when "," is pressed', () => {
    const event = createMockEvent(',')
    const inputReference = createMockInputReference({ selectionStart: 1 })
    const selectSegmentFunction = vi.fn()

    const isResult = didHandleSeparatorKey(
      event,
      separatorKeys,
      inputReference,
      inputValue,
      delimiter,
      segmentNames,
      selectSegmentFunction,
    )

    expect(isResult).toBe(true)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(selectSegmentFunction).toHaveBeenCalledWith('month')
  })

  it('returns false for non-separator key', () => {
    const event = createMockEvent('a')
    const inputReference = createMockInputReference({ selectionStart: 1 })
    const selectSegmentFunction = vi.fn()

    const isResult = didHandleSeparatorKey(
      event,
      separatorKeys,
      inputReference,
      inputValue,
      delimiter,
      segmentNames,
      selectSegmentFunction,
    )

    expect(isResult).toBe(false)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(selectSegmentFunction).not.toHaveBeenCalled()
  })

  it('returns true but does not advance when at last segment', () => {
    const event = createMockEvent('.')
    const inputReference = createMockInputReference({ selectionStart: 8 }) // inside 'year'
    const selectSegmentFunction = vi.fn()

    const isResult = didHandleSeparatorKey(
      event,
      separatorKeys,
      inputReference,
      inputValue,
      delimiter,
      segmentNames,
      selectSegmentFunction,
    )

    expect(isResult).toBe(true)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(selectSegmentFunction).not.toHaveBeenCalled()
  })

  it('advances from first segment to second', () => {
    const event = createMockEvent('.')
    const inputReference = createMockInputReference({ selectionStart: 0 }) // start of 'day'
    const selectSegmentFunction = vi.fn()

    const isResult = didHandleSeparatorKey(
      event,
      separatorKeys,
      inputReference,
      inputValue,
      delimiter,
      segmentNames,
      selectSegmentFunction,
    )

    expect(isResult).toBe(true)
    expect(selectSegmentFunction).toHaveBeenCalledWith('month')
  })
})

describe('didHandleBackspaceDelete', () => {
  it('replaces day segment with placeholder when entire segment is selected', () => {
    vi.useFakeTimers()

    const event = createMockEvent('Backspace')
    const inputReference = createMockInputReference({
      selectionEnd: 2,
      selectionStart: 0,
    })
    const setInputValue = vi.fn()
    const updateStore = vi.fn()
    const selectSegmentFunction = vi.fn()

    const isResult = didHandleBackspaceDelete(
      event,
      inputReference,
      inputValue,
      delimiter,
      segmentNames,
      bounds,
      placeholders,
      setInputValue,
      updateStore,
      selectSegmentFunction,
    )

    expect(isResult).toBe(true)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(setInputValue).toHaveBeenCalledWith('__.03.2026')
    expect(updateStore).toHaveBeenCalledWith('__.03.2026')

    vi.runAllTimers()
    expect(selectSegmentFunction).toHaveBeenCalledWith('day')

    vi.useRealTimers()
  })

  it('returns false when segment is not fully selected (partial selection)', () => {
    const event = createMockEvent('Backspace')
    const inputReference = createMockInputReference({
      selectionEnd: 1,
      selectionStart: 0,
    })
    const setInputValue = vi.fn()
    const updateStore = vi.fn()
    const selectSegmentFunction = vi.fn()

    const isResult = didHandleBackspaceDelete(
      event,
      inputReference,
      inputValue,
      delimiter,
      segmentNames,
      bounds,
      placeholders,
      setInputValue,
      updateStore,
      selectSegmentFunction,
    )

    expect(isResult).toBe(false)
    expect(setInputValue).not.toHaveBeenCalled()
    expect(updateStore).not.toHaveBeenCalled()
  })

  it('handles Delete key same as Backspace', () => {
    vi.useFakeTimers()

    const event = createMockEvent('Delete')
    const inputReference = createMockInputReference({
      selectionEnd: 5,
      selectionStart: 3,
    })
    const setInputValue = vi.fn()
    const updateStore = vi.fn()
    const selectSegmentFunction = vi.fn()

    const isResult = didHandleBackspaceDelete(
      event,
      inputReference,
      inputValue,
      delimiter,
      segmentNames,
      bounds,
      placeholders,
      setInputValue,
      updateStore,
      selectSegmentFunction,
    )

    expect(isResult).toBe(true)
    expect(setInputValue).toHaveBeenCalledWith('24.__.2026')
    expect(updateStore).toHaveBeenCalledWith('24.__.2026')

    vi.runAllTimers()
    expect(selectSegmentFunction).toHaveBeenCalledWith('month')

    vi.useRealTimers()
  })

  it('returns false for non-Backspace/Delete key', () => {
    const event = createMockEvent('a')
    const inputReference = createMockInputReference({
      selectionEnd: 2,
      selectionStart: 0,
    })
    const setInputValue = vi.fn()
    const updateStore = vi.fn()
    const selectSegmentFunction = vi.fn()

    const isResult = didHandleBackspaceDelete(
      event,
      inputReference,
      inputValue,
      delimiter,
      segmentNames,
      bounds,
      placeholders,
      setInputValue,
      updateStore,
      selectSegmentFunction,
    )

    expect(isResult).toBe(false)
    expect(setInputValue).not.toHaveBeenCalled()
  })

  it('returns false when selectionStart is null', () => {
    const event = createMockEvent('Backspace')
    const inputReference = toInputReference({
      blur: vi.fn(),
      selectionEnd: null,
      selectionStart: null,
    })
    const setInputValue = vi.fn()
    const updateStore = vi.fn()
    const selectSegmentFunction = vi.fn()

    const isResult = didHandleBackspaceDelete(
      event,
      inputReference,
      inputValue,
      delimiter,
      segmentNames,
      bounds,
      placeholders,
      setInputValue,
      updateStore,
      selectSegmentFunction,
    )

    expect(isResult).toBe(false)
    expect(setInputValue).not.toHaveBeenCalled()
  })
})
