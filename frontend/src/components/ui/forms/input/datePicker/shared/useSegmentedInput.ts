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
  [key: string]: { start: number; end: number }
}

/**
 * Common hook for segmented input functionality
 */
export function useSegmentedInput<TSegment extends string>(
  initialValue: string,
  placeholder: string,
) {
  const [inputValue, setInputValue] = useState<string>(initialValue)
  const [selectedSegment, setSelectedSegment] = useState<TSegment | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
    getSegmentFromPosition: (position: number, value: string) => TSegment | null,
    selectSegment: (segment: TSegment) => void,
  ) => {
    setTimeout(() => {
      const position = inputRef.current?.selectionStart
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
    getSegmentBounds: (value: string) => SegmentBounds | null,
  ): void => {
    const bounds = getSegmentBounds(inputValue)
    if (!bounds || !inputRef.current) return

    const segmentBounds = bounds[segment]
    if (!segmentBounds) return

    inputRef.current.focus()
    inputRef.current.setSelectionRange(segmentBounds.start, segmentBounds.end)
    setSelectedSegment(segment)
  }

  return {
    inputValue,
    setInputValue,
    selectedSegment,
    setSelectedSegment,
    inputRef,
    handleFocus,
    handleClick,
    selectSegment,
  }
}

/**
 * Common keyboard navigation for segmented inputs
 */
export function useSegmentNavigation<TSegment extends string>(
  segments: TSegment[],
  getSegmentFromPosition: (position: number, value: string) => TSegment | null,
  selectSegment: (segment: TSegment) => void,
  separator: string,
) {
  const handleSegmentNavigation = (
    e: React.KeyboardEvent<HTMLInputElement>,
    inputRef: React.RefObject<HTMLInputElement>,
    inputValue: string,
  ) => {
    // Separator key to move to next segment
    if (e.key === separator) {
      e.preventDefault()
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment) {
          const currentIndex = segments.indexOf(segment)
          if (currentIndex < segments.length - 1) {
            selectSegment(segments[currentIndex + 1])
          }
        }
      }
    }

    // Tab navigation
    if (e.key === 'Tab') {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment) {
          const currentIndex = segments.indexOf(segment)

          if (!e.shiftKey && currentIndex < segments.length - 1) {
            e.preventDefault()
            selectSegment(segments[currentIndex + 1])
          } else if (e.shiftKey && currentIndex > 0) {
            e.preventDefault()
            selectSegment(segments[currentIndex - 1])
          }
        }
      }
    }
  }

  return { handleSegmentNavigation }
}
