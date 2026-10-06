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

import { getSegmentBounds } from '../core/segment-bounds'
import { type SegmentConfig } from '../core/segment-config'

type InputChangeHandlerParameters<T extends string> = {
  config: SegmentConfig<T>
  inputRef: React.RefObject<HTMLInputElement | null>
  inputValue: string
  selectedSegment: null | T
  selectSegmentFn: (segment: T) => void
  setCursorPosition?: (pos: number) => void
  setInputValue: (value: string) => void
  updateStore: (value: string) => void
}

type SegmentEdit<T extends string> = {
  /** Cursor position after the typed digits, when the segment is not complete yet */
  cursorPos: null | number
  /** Segment to select next, when the edited segment is complete */
  nextSegment: null | T
  updatedValue: string
}

/**
 * Generic handler for input changes in segmented inputs
 * Handles smart segment replacement and auto-advance on overflow
 */
export function createInputChangeHandler<T extends string>(
  parameters: InputChangeHandlerParameters<T>,
) {
  const {
    config,
    inputRef,
    inputValue,
    selectedSegment,
    selectSegmentFn,
    setCursorPosition,
    setInputValue,
    updateStore,
  } = parameters

  return (event: React.ChangeEvent<HTMLInputElement>): void => {
    let newValue = event.target.value

    // Replace alternative delimiters (e.g., '.' for ':' in time input)
    if (config.delimiter === ':' && newValue.includes('.')) {
      newValue = newValue.replaceAll('.', ':')
    }

    // Smart input validation: only allow configured characters
    const pattern = new RegExp(`^${config.allowedCharsPattern.source}*$`)
    if (newValue && !pattern.test(newValue)) {
      return
    }

    const edit =
      selectedSegment && inputRef.current
        ? resolveSegmentEdit(config, inputValue, newValue, selectedSegment)
        : null

    if (!edit) {
      setInputValue(newValue)
      updateStore(newValue)
      return
    }

    setInputValue(edit.updatedValue)
    updateStore(edit.updatedValue)
    const { cursorPos, nextSegment } = edit
    if (nextSegment) setTimeout(() => selectSegmentFn(nextSegment), 0)
    if (cursorPos !== null) setCursorPosition?.(cursorPos)
  }
}

/**
 * Apply a digit edit of the selected segment to the previous value. Returns null when the change is
 * not a digit edit of that segment, so the caller keeps the plain new value.
 */
function resolveSegmentEdit<T extends string>(
  config: SegmentConfig<T>,
  previousValue: string,
  newValue: string,
  selectedSegment: T,
): null | SegmentEdit<T> {
  if (!getSegmentBounds(previousValue, config.delimiter, config.segments)) return null

  const segmentIndex = config.segments.indexOf(selectedSegment)
  const parts = previousValue.split(config.delimiter)
  const newSegmentValue = newValue.split(config.delimiter)[segmentIndex]
  if (
    !newSegmentValue ||
    newSegmentValue === parts[segmentIndex] ||
    !/^\d+$/.test(newSegmentValue)
  ) {
    return null
  }

  parts[segmentIndex] = newSegmentValue
  const updatedValue = parts.join(config.delimiter)

  if (newSegmentValue.length >= config.segmentPlaceholders[selectedSegment].length) {
    return { cursorPos: null, nextSegment: config.segments[segmentIndex + 1] ?? null, updatedValue }
  }

  const cursorPos = parts
    .slice(0, segmentIndex + 1)
    .reduce(
      (pos, part, index) =>
        pos + part.length + (index < segmentIndex ? config.delimiter.length : 0),
      0,
    )
  return { cursorPos, nextSegment: null, updatedValue }
}
