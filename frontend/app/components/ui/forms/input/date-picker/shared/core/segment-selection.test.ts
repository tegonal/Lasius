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

import { createHandleClick } from './segment-selection'

type DateSegment = 'day' | 'month' | 'year'
const DATE_SEGMENTS: DateSegment[] = ['day', 'month', 'year']
const PLACEHOLDER = 'DD.MM.YYYY'

const inputReference = (
  selectionStart: null | number | undefined,
): React.RefObject<HTMLInputElement | null> => ({
  current:
    selectionStart === undefined ? null : ({ selectionStart } as unknown as HTMLInputElement),
})

const click = (reference: React.RefObject<HTMLInputElement | null>, inputValue: string) => {
  const onSelect = vi.fn()
  createHandleClick(
    reference,
    inputValue,
    PLACEHOLDER,
    '.',
    DATE_SEGMENTS,
    onSelect,
  )({} as unknown as React.MouseEvent<HTMLInputElement>)
  return onSelect
}

describe('createHandleClick', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('selects the segment at the cursor after the tick', () => {
    const onSelect = click(inputReference(4), '24.03.2026')

    expect(onSelect).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('month')
  })

  it.each([
    ['the value is the placeholder', inputReference(4), PLACEHOLDER],
    ['the value is empty', inputReference(0), ''],
    ['the ref is empty', inputReference(undefined), '24.03.2026'],
    ['the input has no selection', inputReference(null), '24.03.2026'],
    ['the value does not split into the segments', inputReference(1), '24.03'],
  ])('does nothing when %s', (_case, reference, inputValue) => {
    const onSelect = click(reference, inputValue)
    vi.runAllTimers()
    expect(onSelect).not.toHaveBeenCalled()
  })
})
