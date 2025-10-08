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

/**
 * Common utility for handling segment replacement when typing
 */
export function handleSegmentReplacement<TSegment extends string>(
  inputValue: string,
  newValue: string,
  selectedSegment: TSegment | null,
  selectionStart: number | null,
  selectionEnd: number | null,
  segmentBounds: { start: number; end: number },
  separator: string,
  getSegmentIndex: (segment: TSegment) => number,
  formatSegmentValue: (value: string, segment: TSegment) => string,
) {
  // Check if selection matches the segment bounds (user is replacing the segment)
  if (selectionStart === segmentBounds.start && selectionEnd === segmentBounds.end) {
    const parts = inputValue.split(separator)
    const typedChar = newValue.slice(selectionStart, selectionStart + 1)

    if (/\d/.test(typedChar) && selectedSegment) {
      const segmentIndex = getSegmentIndex(selectedSegment)
      if (segmentIndex >= 0 && segmentIndex < parts.length) {
        parts[segmentIndex] = formatSegmentValue(typedChar, selectedSegment)
        return {
          newValue: parts.join(separator),
          shouldAdvance: true,
        }
      }
    }
  }

  return null
}

/**
 * Common utility for handling multi-digit input in segments
 */
export function handleMultiDigitInput<TSegment extends string>(
  inputValue: string,
  newValue: string,
  selectedSegment: TSegment | null,
  separator: string,
  getSegmentIndex: (segment: TSegment) => number,
  shouldAutoAdvance: (segment: TSegment, parts: string[]) => boolean,
) {
  // Check if we're typing a digit and the segment already has content
  if (/^\d$/.test(newValue.slice(-1)) && newValue.length > inputValue.length && selectedSegment) {
    const parts = inputValue.split(separator)
    const newDigit = newValue.slice(-1)
    const segmentIndex = getSegmentIndex(selectedSegment)

    if (segmentIndex >= 0 && segmentIndex < parts.length) {
      const currentSegment = parts[segmentIndex]
      if (/^\d+$/.test(currentSegment)) {
        parts[segmentIndex] = currentSegment + newDigit
        return {
          newValue: parts.join(separator),
          shouldAdvance: shouldAutoAdvance(selectedSegment, parts),
        }
      }
    }
  }

  return null
}

/**
 * Common arrow key increment/decrement for date/time values
 */
export function handleArrowIncrement(date: Date, segment: string, increment: number): Date {
  const newDate = new Date(date)

  switch (segment) {
    case 'day':
      newDate.setDate(newDate.getDate() + increment)
      break
    case 'month':
      newDate.setMonth(newDate.getMonth() + increment)
      break
    case 'year':
      newDate.setFullYear(newDate.getFullYear() + increment)
      break
    case 'hour':
      newDate.setHours((newDate.getHours() + increment + 24) % 24)
      break
    case 'minute':
      newDate.setMinutes((newDate.getMinutes() + increment + 60) % 60)
      break
  }

  return newDate
}
