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

import {
  DATE_SEGMENT_CONFIG,
  type DateSegment,
  type SegmentConfig,
  TIME_SEGMENT_CONFIG,
  type TimeSegment,
} from '../core/segment-config'
import { createInputChangeHandler } from './input-change-handler'

const changeEvent = (value: string) =>
  ({ target: { value } }) as unknown as React.ChangeEvent<HTMLInputElement>

function setup<T extends string>(
  config: SegmentConfig<T>,
  inputValue: string,
  selectedSegment: null | T,
  hasInput = true,
) {
  const spies = {
    selectSegmentFn: vi.fn(),
    setCursorPosition: vi.fn(),
    setInputValue: vi.fn(),
    updateStore: vi.fn(),
  }
  // The handler only checks that the ref holds an element, so any object stands in for it.
  const inputElement: HTMLInputElement | null = hasInput ? Object.create(null) : null
  const handler = createInputChangeHandler({
    config,
    inputRef: { current: inputElement },
    inputValue,
    selectedSegment,
    ...spies,
  })
  return { handler, ...spies }
}

describe('createInputChangeHandler', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('replaces a dot with a colon in a time input', () => {
    const { handler, setInputValue, updateStore } = setup<TimeSegment>(
      TIME_SEGMENT_CONFIG,
      '',
      null,
    )
    handler(changeEvent('09.30'))
    expect(setInputValue).toHaveBeenCalledWith('09:30')
    expect(updateStore).toHaveBeenCalledWith('09:30')
  })

  it('keeps a dot in a date input', () => {
    const { handler, setInputValue } = setup<DateSegment>(DATE_SEGMENT_CONFIG, '', null)
    handler(changeEvent('24.03.2026'))
    expect(setInputValue).toHaveBeenCalledWith('24.03.2026')
  })

  it('ignores a value with a character that the config does not allow', () => {
    const { handler, setInputValue, updateStore } = setup<TimeSegment>(
      TIME_SEGMENT_CONFIG,
      '09:30',
      null,
    )
    handler(changeEvent('09:3a'))
    expect(setInputValue).not.toHaveBeenCalled()
    expect(updateStore).not.toHaveBeenCalled()
  })

  it('accepts an empty value', () => {
    const { handler, setInputValue, updateStore } = setup<TimeSegment>(
      TIME_SEGMENT_CONFIG,
      '09:30',
      null,
    )
    handler(changeEvent(''))
    expect(setInputValue).toHaveBeenCalledWith('')
    expect(updateStore).toHaveBeenCalledWith('')
  })

  it('advances to the next segment when the edited segment is complete', () => {
    const { handler, selectSegmentFn, setCursorPosition, setInputValue, updateStore } =
      setup<TimeSegment>(TIME_SEGMENT_CONFIG, '1:30', 'hour')
    handler(changeEvent('12:30'))
    expect(setInputValue).toHaveBeenCalledWith('12:30')
    expect(updateStore).toHaveBeenCalledWith('12:30')
    expect(selectSegmentFn).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(selectSegmentFn).toHaveBeenCalledWith('minute')
    expect(setCursorPosition).not.toHaveBeenCalled()
  })

  it('does not advance past the last segment', () => {
    const { handler, selectSegmentFn, setInputValue } = setup<TimeSegment>(
      TIME_SEGMENT_CONFIG,
      '09:__',
      'minute',
    )
    handler(changeEvent('09:45'))
    expect(setInputValue).toHaveBeenCalledWith('09:45')
    vi.runAllTimers()
    expect(selectSegmentFn).not.toHaveBeenCalled()
  })

  it('places the cursor after the typed digits of an incomplete segment', () => {
    const { handler, selectSegmentFn, setCursorPosition, setInputValue } = setup<DateSegment>(
      DATE_SEGMENT_CONFIG,
      '24.03.____',
      'year',
    )
    handler(changeEvent('24.03.20'))
    expect(setInputValue).toHaveBeenCalledWith('24.03.20')
    expect(setCursorPosition).toHaveBeenCalledWith(8)
    vi.runAllTimers()
    expect(selectSegmentFn).not.toHaveBeenCalled()
  })

  it('takes the edited segment and keeps the other segments of the previous value', () => {
    const { handler, setInputValue } = setup<DateSegment>(DATE_SEGMENT_CONFIG, '24.03.2026', 'day')
    handler(changeEvent('25.04.2027'))
    expect(setInputValue).toHaveBeenCalledWith('25.03.2026')
  })

  it('falls back to the plain value when the segment did not change', () => {
    const { handler, selectSegmentFn, setInputValue } = setup<TimeSegment>(
      TIME_SEGMENT_CONFIG,
      '09:30',
      'hour',
    )
    handler(changeEvent('09:31'))
    expect(setInputValue).toHaveBeenCalledWith('09:31')
    vi.runAllTimers()
    expect(selectSegmentFn).not.toHaveBeenCalled()
  })

  it('falls back to the plain value when the edited segment is empty', () => {
    const { handler, setCursorPosition, setInputValue } = setup<TimeSegment>(
      TIME_SEGMENT_CONFIG,
      '09:30',
      'hour',
    )
    handler(changeEvent(':30'))
    expect(setInputValue).toHaveBeenCalledWith(':30')
    expect(setCursorPosition).not.toHaveBeenCalled()
  })

  it('falls back to the plain value when the edited segment holds a delimiter character', () => {
    const { handler, setInputValue } = setup<DateSegment>(DATE_SEGMENT_CONFIG, '24.03', 'day')
    handler(changeEvent('2.4.03'))
    expect(setInputValue).toHaveBeenCalledWith('2.4.03')
  })

  it('falls back to the plain value when the previous value has the wrong segment count', () => {
    const { handler, setInputValue } = setup<TimeSegment>(TIME_SEGMENT_CONFIG, '0930', 'hour')
    handler(changeEvent('09:30'))
    expect(setInputValue).toHaveBeenCalledWith('09:30')
  })

  it('falls back to the plain value without an input element', () => {
    const { handler, selectSegmentFn, setInputValue } = setup<TimeSegment>(
      TIME_SEGMENT_CONFIG,
      '1:30',
      'hour',
      false,
    )
    handler(changeEvent('12:30'))
    expect(setInputValue).toHaveBeenCalledWith('12:30')
    vi.runAllTimers()
    expect(selectSegmentFn).not.toHaveBeenCalled()
  })
})
