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

type InputChangeHandlerParams<T extends string> = {
  config: SegmentConfig<T>
  inputRef: React.RefObject<HTMLInputElement | null>
  inputValue: string
  selectedSegment: null | T
  selectSegmentFn: (segment: T) => void
  setCursorPosition?: (pos: number) => void
  setInputValue: (value: string) => void
  updateStore: (value: string) => void
}

/**
 * Generic handler for input changes in segmented inputs
 * Handles smart segment replacement and auto-advance on overflow
 */
export function createInputChangeHandler<T extends string>(
  params: InputChangeHandlerParams<T>,
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
  } = params

  return (e: React.ChangeEvent<HTMLInputElement>): void => {
    let newValue = e.target.value

    // Replace alternative delimiters (e.g., '.' for ':' in time input)
    if (config.delimiter === ':' && newValue.includes('.')) {
      newValue = newValue.replaceAll('.', config.delimiter)
    }

    const prevValue = inputValue

    // Smart input validation: only allow configured characters
    const pattern = new RegExp(`^${config.allowedCharsPattern.source}*$`)
    if (newValue && !pattern.test(newValue)) {
      return
    }

    // Check if we're editing a segment
    if (selectedSegment && inputRef.current) {
      const bounds = getSegmentBounds(
        prevValue,
        config.delimiter,
        config.segments,
      )
      if (bounds) {
        const segmentIndex = config.segments.indexOf(selectedSegment)
        const prevParts = prevValue.split(config.delimiter)
        const newParts = newValue.split(config.delimiter)
        const prevSegmentValue = prevParts[segmentIndex]
        const newSegmentValue = newParts[segmentIndex]

        // If the segment value changed and we got a digit
        if (
          newSegmentValue !== prevSegmentValue &&
          newSegmentValue &&
          /^\d+$/.test(newSegmentValue)
        ) {
          const requiredLength =
            config.segmentPlaceholders[selectedSegment].length

          // Build the corrected value with the segment change
          const parts = [...prevParts]
          parts[segmentIndex] = newSegmentValue
          const updatedValue = parts.join(config.delimiter)

          setInputValue(updatedValue)
          updateStore(updatedValue)

          // Auto-advance only if we've reached the required length for this segment
          if (newSegmentValue.length >= requiredLength) {
            // Segment is complete, advance to next
            const nextIndex = segmentIndex + 1
            const nextSegment = config.segments[nextIndex]
            if (nextIndex < config.segments.length && nextSegment) {
              setTimeout(() => selectSegmentFn(nextSegment), 0)
            }
          } else {
            // Still typing in this segment, position cursor after the last digit
            let cursorPos = 0
            for (let i = 0; i < segmentIndex; i++) {
              cursorPos += (parts[i] ?? '').length + config.delimiter.length
            }
            cursorPos += (parts[segmentIndex] ?? '').length
            if (setCursorPosition) {
              setCursorPosition(cursorPos)
            }
          }
          return
        }
      }
    }

    // Default behavior
    setInputValue(newValue)
    updateStore(newValue)
  }
}
