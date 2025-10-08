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

import { getSegmentBounds, getSegmentFromPosition } from './segmentBounds'

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
