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

import { type SegmentBounds } from './segment-bounds'

/**
 * Get the adjacent segment in a given direction.
 * Returns null if there is no segment in that direction.
 */
export function getAdjacentSegment<T extends string>(
  segment: T,
  direction: 'next' | 'prev',
  segmentNames: T[],
): null | T {
  const index = segmentNames.indexOf(segment)
  if (index === -1) return null
  const targetIndex = direction === 'next' ? index + 1 : index - 1
  return segmentNames[targetIndex] ?? null
}

/**
 * Determine if an arrow key (left/right) at the given cursor position
 * should navigate to an adjacent segment (i.e., cursor is at segment boundary).
 * Returns the target segment or null if no navigation should occur.
 */
export function getArrowKeyTarget<T extends string>(
  key: 'ArrowLeft' | 'ArrowRight',
  position: number,
  segment: T,
  bounds: SegmentBounds<T>,
  segmentNames: T[],
): null | T {
  const segmentBounds = bounds[segment]
  if (key === 'ArrowLeft' && position === segmentBounds.start) {
    return getAdjacentSegment(segment, 'prev', segmentNames)
  }
  if (key === 'ArrowRight' && position === segmentBounds.end) {
    return getAdjacentSegment(segment, 'next', segmentNames)
  }
  return null
}

/**
 * Determine the target segment for Tab/Shift+Tab navigation.
 * Returns the target segment or null if the browser default should apply.
 */
export function getTabTarget<T extends string>(
  shiftKey: boolean,
  segment: T,
  segmentNames: T[],
): null | T {
  return getAdjacentSegment(segment, shiftKey ? 'prev' : 'next', segmentNames)
}
