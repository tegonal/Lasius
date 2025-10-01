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

import React from 'react'

export type SegmentBounds<T extends string> = Record<T, { start: number; end: number }>

/**
 * Calculate segment boundaries in a delimited string
 */
export function getSegmentBounds<T extends string>(
  value: string,
  delimiter: string,
  segmentNames: T[],
): SegmentBounds<T> | null {
  const parts = value.split(delimiter)
  if (parts.length !== segmentNames.length) return null

  const bounds = {} as SegmentBounds<T>
  let currentPos = 0

  segmentNames.forEach((name, index) => {
    const partLength = parts[index].length
    bounds[name] = {
      start: currentPos,
      end: currentPos + partLength,
    }
    currentPos += partLength + delimiter.length
  })

  return bounds
}

/**
 * Determine which segment the cursor is in based on position
 */
export function getSegmentFromPosition<T extends string>(
  position: number,
  value: string,
  delimiter: string,
  segmentNames: T[],
): T | null {
  const bounds = getSegmentBounds(value, delimiter, segmentNames)
  if (!bounds) return null

  for (const segmentName of segmentNames) {
    if (position <= bounds[segmentName].end) {
      return segmentName
    }
  }

  return segmentNames[segmentNames.length - 1]
}

/**
 * Select a segment by setting cursor selection range
 */
export function selectSegment<T extends string>(
  segment: T,
  inputValue: string,
  delimiter: string,
  segmentNames: T[],
  inputRef: React.RefObject<HTMLInputElement | null>,
  setSelectedSegment: (segment: T | null) => void,
): void {
  const bounds = getSegmentBounds(inputValue, delimiter, segmentNames)
  if (!bounds || !inputRef.current) return

  const segmentBounds = bounds[segment]
  if (!segmentBounds) return

  inputRef.current.focus()
  inputRef.current.setSelectionRange(segmentBounds.start, segmentBounds.end)
  setSelectedSegment(segment)
}

/**
 * Handle click to select segment
 */
export function createHandleClick<T extends string>(
  inputRef: React.RefObject<HTMLInputElement | null>,
  inputValue: string,
  placeholder: string,
  delimiter: string,
  segmentNames: T[],
  selectSegmentFn: (segment: T) => void,
) {
  return (_e: React.MouseEvent<HTMLInputElement>): void => {
    setTimeout(() => {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number' && inputValue && inputValue !== placeholder) {
        const segment = getSegmentFromPosition(position, inputValue, delimiter, segmentNames)
        if (segment) {
          selectSegmentFn(segment)
        }
      }
    }, 0)
  }
}

/**
 * Validate input character - block invalid characters
 */
export function validateInputChar(key: string, allowedChars: RegExp): boolean {
  if (key.length === 1 && !allowedChars.test(key)) {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
    ]
    return allowedKeys.includes(key)
  }
  return true
}

/**
 * Handle Escape key - reset to initial value
 */
export function handleEscapeKey(
  e: React.KeyboardEvent<HTMLInputElement>,
  inputRef: React.RefObject<HTMLInputElement | null>,
  resetToInitial: () => void,
): boolean {
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation() // Prevent modal close
    resetToInitial()
    inputRef.current?.blur()
    return true
  }
  return false
}

/**
 * Handle Backspace/Delete - clear selected segment
 */
export function handleBackspaceDelete<T extends string>(
  e: React.KeyboardEvent<HTMLInputElement>,
  inputRef: React.RefObject<HTMLInputElement | null>,
  inputValue: string,
  delimiter: string,
  segmentNames: T[],
  bounds: SegmentBounds<T>,
  placeholders: Record<T, string>,
  setInputValue: (value: string) => void,
  updateStore: (value: string) => void,
  selectSegmentFn: (segment: T) => void,
): boolean {
  if (e.key === 'Backspace' || e.key === 'Delete') {
    const position = inputRef.current?.selectionStart
    const selectionEnd = inputRef.current?.selectionEnd

    if (typeof position === 'number' && typeof selectionEnd === 'number') {
      const segment = getSegmentFromPosition(position, inputValue, delimiter, segmentNames)
      if (!segment) return false

      const segmentBounds = bounds[segment]

      // If entire segment is selected, clear it
      if (position === segmentBounds.start && selectionEnd === segmentBounds.end) {
        e.preventDefault()
        const parts = inputValue.split(delimiter)
        const segmentIndex = segmentNames.indexOf(segment)
        parts[segmentIndex] = placeholders[segment]

        const updatedValue = parts.join(delimiter)
        setInputValue(updatedValue)
        updateStore(updatedValue)
        setTimeout(() => selectSegmentFn(segment), 0)
        return true
      }
    }
  }
  return false
}

/**
 * Handle separator key (. or : or ,) to move to next segment
 */
export function handleSeparatorKey<T extends string>(
  e: React.KeyboardEvent<HTMLInputElement>,
  separatorKeys: string[],
  inputRef: React.RefObject<HTMLInputElement | null>,
  inputValue: string,
  delimiter: string,
  segmentNames: T[],
  selectSegmentFn: (segment: T) => void,
): boolean {
  if (separatorKeys.includes(e.key)) {
    e.preventDefault()
    const position = inputRef.current?.selectionStart
    if (typeof position === 'number') {
      const segment = getSegmentFromPosition(position, inputValue, delimiter, segmentNames)
      if (segment) {
        const currentIndex = segmentNames.indexOf(segment)
        if (currentIndex < segmentNames.length - 1) {
          selectSegmentFn(segmentNames[currentIndex + 1])
        }
      }
    }
    return true
  }
  return false
}
