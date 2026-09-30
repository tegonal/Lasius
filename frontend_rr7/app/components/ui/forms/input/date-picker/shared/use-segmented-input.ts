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

import { useRef, useState } from 'react'

export type SegmentBounds = {
  [key: string]: { end: number; start: number }
}

/**
 * Common hook for segmented input functionality
 */
export function useSegmentedInput<TSegment extends string>(
  initialValue: string,
  placeholder: string,
) {
  const [inputValue, setInputValue] = useState<string>(initialValue)
  const [selectedSegment, setSelectedSegment] = useState<null | TSegment>(null)
  const inputReference = useRef<HTMLInputElement>(null)

  // Handle focus to select first segment
  const handleFocus = (onFirstSegmentSelect: () => void) => {
    if (inputValue === placeholder) {
      setInputValue('')
    } else if (inputValue) {
      setTimeout(onFirstSegmentSelect, 0)
    }
  }

  // Handle click to select segment
  const handleClick = (
    getSegmentFromPosition: (position: number, value: string) => null | TSegment,
    selectSegment: (segment: TSegment) => void,
  ) => {
    setTimeout(() => {
      const position = inputReference.current?.selectionStart
      if (typeof position === 'number' && inputValue && inputValue !== placeholder) {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment) {
          selectSegment(segment)
        }
      }
    }, 0)
  }

  // Select a segment
  const selectSegment = (
    segment: TSegment,
    getSegmentBounds: (value: string) => null | SegmentBounds,
  ): void => {
    const bounds = getSegmentBounds(inputValue)
    if (!bounds || !inputReference.current) return

    const segmentBounds = bounds[segment]
    if (!segmentBounds) return

    inputReference.current.focus()
    inputReference.current.setSelectionRange(segmentBounds.start, segmentBounds.end)
    setSelectedSegment(segment)
  }

  return {
    handleClick,
    handleFocus,
    inputRef: inputReference,
    inputValue,
    selectedSegment,
    selectSegment,
    setInputValue,
    setSelectedSegment,
  }
}

/**
 * Common keyboard navigation for segmented inputs
 */
export function useSegmentNavigation<TSegment extends string>(
  segments: TSegment[],
  getSegmentFromPosition: (position: number, value: string) => null | TSegment,
  selectSegment: (segment: TSegment) => void,
  separator: string,
) {
  const handleSegmentNavigation = (
    event: React.KeyboardEvent<HTMLInputElement>,
    inputReference: React.RefObject<HTMLInputElement>,
    inputValue: string,
  ) => {
    // Separator key to move to next segment
    if (event.key === separator) {
      event.preventDefault()
      const position = inputReference.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment) {
          const currentIndex = segments.indexOf(segment)
          const nextSegment = segments[currentIndex + 1]
          if (currentIndex < segments.length - 1 && nextSegment) {
            selectSegment(nextSegment)
          }
        }
      }
    }

    // Tab navigation
    if (event.key === 'Tab') {
      const position = inputReference.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment) {
          const currentIndex = segments.indexOf(segment)

          const nextSeg = segments[currentIndex + 1]
          const previousSeg = segments[currentIndex - 1]
          if (!event.shiftKey && currentIndex < segments.length - 1 && nextSeg) {
            event.preventDefault()
            selectSegment(nextSeg)
          } else if (event.shiftKey && currentIndex > 0 && previousSeg) {
            event.preventDefault()
            selectSegment(previousSeg)
          }
        }
      }
    }
  }

  return { handleSegmentNavigation }
}
