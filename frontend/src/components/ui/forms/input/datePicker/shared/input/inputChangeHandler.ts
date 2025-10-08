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

import { getSegmentBounds } from '../core/segmentBounds'

import type { SegmentConfig } from '../core/segmentConfig'

type InputChangeHandlerParams<T extends string> = {
  config: SegmentConfig<T>
  inputValue: string
  selectedSegment: T | null
  inputRef: React.RefObject<HTMLInputElement | null>
  setInputValue: (value: string) => void
  updateStore: (value: string) => void
  selectSegmentFn: (segment: T) => void
}

/**
 * Generic handler for input changes in segmented inputs
 * Handles smart segment replacement and auto-advance on overflow
 */
export function createInputChangeHandler<T extends string>(params: InputChangeHandlerParams<T>) {
  const {
    config,
    inputValue,
    selectedSegment,
    inputRef,
    setInputValue,
    updateStore,
    selectSegmentFn,
  } = params

  return (e: React.ChangeEvent<HTMLInputElement>): void => {
    let newValue = e.target.value

    // Replace alternative delimiters (e.g., '.' for ':' in time input)
    if (config.delimiter === ':' && newValue.includes('.')) {
      newValue = newValue.replace(/\./g, config.delimiter)
    }

    const prevValue = inputValue

    // Smart input validation: only allow configured characters
    const pattern = new RegExp(`^[${config.allowedCharsPattern.source}]*$`)
    if (newValue && !pattern.test(newValue)) {
      return
    }

    // Check if we're replacing a segment
    if (selectedSegment && inputRef.current) {
      const bounds = getSegmentBounds(prevValue, config.delimiter, config.segments)
      if (bounds) {
        const segmentBounds = bounds[selectedSegment]
        const selStart = inputRef.current.selectionStart
        const selEnd = inputRef.current.selectionEnd

        // If selection matches a segment, we're replacing it
        if (selStart === segmentBounds.start && selEnd === segmentBounds.end) {
          const parts = prevValue.split(config.delimiter)
          const typedChar = newValue.slice(selStart, selStart + 1)

          if (/\d/.test(typedChar)) {
            const digit = parseInt(typedChar, 10)
            const maxFirstDigit = config.segmentMaxFirstDigit[selectedSegment]

            // Smart overflow handling: auto-advance if first digit exceeds max possible
            if (digit > maxFirstDigit) {
              const segmentIndex = config.segments.indexOf(selectedSegment)
              parts[segmentIndex] = typedChar.padStart(
                config.segmentPlaceholders[selectedSegment].length,
                '0',
              )
              const updatedValue = parts.join(config.delimiter)
              setInputValue(updatedValue)
              updateStore(updatedValue)

              // Move to next segment if not the last
              const nextIndex = segmentIndex + 1
              if (nextIndex < config.segments.length) {
                setTimeout(() => selectSegmentFn(config.segments[nextIndex]), 0)
              }
              return
            }

            // Replace the segment with the typed digit
            const segmentIndex = config.segments.indexOf(selectedSegment)
            const isLastSegmentAndLonger =
              segmentIndex === config.segments.length - 1 &&
              config.segmentPlaceholders[selectedSegment].length > 2

            if (isLastSegmentAndLonger) {
              // For year segment, don't pad
              parts[segmentIndex] = typedChar
            } else {
              // For day/month/hour/minute, pad to 2 digits
              parts[segmentIndex] = typedChar.padStart(2, '0')
            }

            const updatedValue = parts.join(config.delimiter)
            setInputValue(updatedValue)
            updateStore(updatedValue)

            // Move to next segment if not the last
            const nextIndex = segmentIndex + 1
            if (nextIndex < config.segments.length) {
              setTimeout(() => selectSegmentFn(config.segments[nextIndex]), 0)
            }

            return
          }
        }

        // If we're typing a digit and the segment already has a single digit
        if (/^\d$/.test(newValue.slice(-1)) && newValue.length > prevValue.length) {
          const parts = prevValue.split(config.delimiter)
          const newDigit = newValue.slice(-1)
          const segmentIndex = config.segments.indexOf(selectedSegment)
          const currentPart = parts[segmentIndex]

          if (/^\d$/.test(currentPart)) {
            parts[segmentIndex] = currentPart + newDigit
            const updatedValue = parts.join(config.delimiter)
            setInputValue(updatedValue)
            updateStore(updatedValue)

            // Move to next segment if not the last
            const nextIndex = segmentIndex + 1
            if (nextIndex < config.segments.length) {
              setTimeout(() => selectSegmentFn(config.segments[nextIndex]), 0)
            }
            return
          }
        }
      }
    }

    // Default behavior
    setInputValue(newValue)
    updateStore(newValue)
  }
}
