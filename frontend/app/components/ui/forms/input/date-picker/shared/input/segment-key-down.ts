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

import {
  getSegmentBounds,
  getSegmentFromPosition,
  type SegmentBounds,
} from '../core/segment-bounds'
import { type SegmentConfig } from '../core/segment-config'
import { getArrowKeyTarget, getTabTarget } from '../core/segment-navigation'
import { isValidInputChar } from './input-validation'
import {
  didHandleBackspaceDelete,
  didHandleEscapeKey,
  didHandleSeparatorKey,
} from './keyboard-handlers'

export type SegmentKeyAction<T extends string> =
  null | { direction: -1 | 1; kind: 'step' } | { kind: 'select'; target: T }

export type SegmentKeyDownContext<T extends string> = {
  config: SegmentConfig<T>
  inputRef: React.RefObject<HTMLInputElement | null>
  inputValue: string
  resetToInitial: () => void
  selectSegment: (segment: T) => void
  setInputValue: (value: string) => void
  /** Changes the segment value by one step. The segment is null when the cursor is in no segment. */
  stepSegment: (segment: null | T, direction: -1 | 1) => void
  updateFromString: (value: string) => void
}

const getNavigationTarget = <T extends string>(
  key: string,
  isShiftPressed: boolean,
  position: null | number | undefined,
  segment: T,
  bounds: SegmentBounds<T>,
  segmentNames: T[],
): null | T => {
  if (key === 'Tab') return getTabTarget(isShiftPressed, segment, segmentNames)
  if ((key === 'ArrowLeft' || key === 'ArrowRight') && typeof position === 'number') {
    return getArrowKeyTarget(key, position, segment, bounds, segmentNames)
  }
  return null
}

/**
 * Maps a key to a segment action. ArrowUp and ArrowDown always step, also without a segment, so
 * the caret never moves. Tab and ArrowLeft/Right select a segment only at a segment boundary.
 */
export function getSegmentKeyAction<T extends string>(
  key: string,
  isShiftPressed: boolean,
  position: null | number | undefined,
  segment: null | T,
  bounds: SegmentBounds<T>,
  segmentNames: T[],
): SegmentKeyAction<T> {
  if (key === 'ArrowUp' || key === 'ArrowDown') {
    return { direction: key === 'ArrowUp' ? 1 : -1, kind: 'step' }
  }
  if (!segment) return null
  const target = getNavigationTarget(key, isShiftPressed, position, segment, bounds, segmentNames)
  return target ? { kind: 'select', target } : null
}

const didHandleEditingKey = <T extends string>(
  event: React.KeyboardEvent<HTMLInputElement>,
  context: SegmentKeyDownContext<T>,
  bounds: SegmentBounds<T>,
): boolean => {
  const { config, inputRef, inputValue, selectSegment } = context
  if (!isValidInputChar(event.key, config.allowedCharsPattern)) {
    // A blocked character must not replace the selected segment.
    event.preventDefault()
    return true
  }
  return (
    didHandleEscapeKey(event, inputRef, context.resetToInitial) ||
    didHandleBackspaceDelete(
      event,
      inputRef,
      inputValue,
      config.delimiter,
      config.segments,
      bounds,
      config.segmentPlaceholders,
      context.setInputValue,
      context.updateFromString,
      selectSegment,
    ) ||
    didHandleSeparatorKey(
      event,
      config.separatorKeys,
      inputRef,
      inputValue,
      config.delimiter,
      config.segments,
      selectSegment,
    )
  )
}

/** The keydown handler of the segmented date, time and duration inputs. */
export function handleSegmentKeyDown<T extends string>(
  event: React.KeyboardEvent<HTMLInputElement>,
  context: SegmentKeyDownContext<T>,
): void {
  const { config, inputRef, inputValue } = context
  const bounds = getSegmentBounds(inputValue, config.delimiter, config.segments)
  if (!bounds || didHandleEditingKey(event, context, bounds)) return

  const position = inputRef.current?.selectionStart
  const segment =
    typeof position === 'number'
      ? getSegmentFromPosition(position, inputValue, config.delimiter, config.segments)
      : null
  const action = getSegmentKeyAction(
    event.key,
    event.shiftKey,
    position,
    segment,
    bounds,
    config.segments,
  )
  if (!action) return

  event.preventDefault()
  if (action.kind === 'select') {
    context.selectSegment(action.target)
  } else {
    context.stepSegment(segment, action.direction)
  }
}
