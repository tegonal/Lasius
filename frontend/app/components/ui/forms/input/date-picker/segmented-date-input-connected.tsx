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

import React, { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/primitives/inputs/input'

import { getSegmentBounds, getSegmentFromPosition } from './shared/core/segment-bounds'
import { DATE_SEGMENT_CONFIG, type DateSegment } from './shared/core/segment-config'
import { getArrowKeyTarget, getTabTarget } from './shared/core/segment-navigation'
import {
  createHandleClick,
  selectSegment as selectSegmentHelper,
} from './shared/core/segment-selection'
import { formatDate } from './shared/date-time-helpers'
import { createInputChangeHandler } from './shared/input/input-change-handler'
import { isValidInputChar } from './shared/input/input-validation'
import {
  didHandleBackspaceDelete,
  didHandleEscapeKey,
  didHandleSeparatorKey,
} from './shared/input/keyboard-handlers'
import { SegmentedInputWrapper } from './shared/segmented-input-wrapper'
import { DatePickerStoreContext, useDatePickerStore } from './store/use-date-picker-store'

export const SegmentedDateInputConnected = ({ afterSlot }: { afterSlot?: React.ReactNode }) => {
  const { t } = useTranslation('common')
  const store = useContext(DatePickerStoreContext)
  const {
    incrementDays,
    incrementMonths,
    incrementYears,
    resetToInitial,
    setDateFromString,
    value,
  } = useDatePickerStore()
  const [inputValue, setInputValue] = useState<string>(value.dateString)
  const [selectedSegment, setSelectedSegment] = useState<DateSegment | null>(null)
  const inputReference = useRef<HTMLInputElement>(null)
  const focusFromMouseReference = useRef<boolean>(false)
  const pendingCursorPosReference = useRef<null | number>(null)

  const config = DATE_SEGMENT_CONFIG

  const incrementBySegment = (segment: DateSegment, increment: number) => {
    const incrementFns: Record<DateSegment, (n: number) => void> = {
      day: incrementDays,
      month: incrementMonths,
      year: incrementYears,
    }
    incrementFns[segment](increment)
  }

  // Sync with store
  useEffect(() => {
    if (value.dateString !== inputValue && !inputReference.current?.matches(':focus')) {
      setInputValue(value.dateString || config.placeholder)
    }
  }, [value.dateString, inputValue, config.placeholder])

  // Restore cursor position after inputValue changes (runs synchronously before paint)
  React.useLayoutEffect(() => {
    if (pendingCursorPosReference.current === null || !inputReference.current?.matches(':focus')) {
      return
    }

    const pos = pendingCursorPosReference.current
    pendingCursorPosReference.current = null
    inputReference.current.setSelectionRange(pos, pos)
  }, [inputValue])

  // Select a segment using helper
  const selectSegment = (segment: DateSegment): void => {
    selectSegmentHelper(
      segment,
      inputValue,
      config.delimiter,
      config.segments,
      inputReference,
      setSelectedSegment,
    )
  }

  // Handle mouse down to set flag before focus
  const handleMouseDown = () => {
    focusFromMouseReference.current = true
  }

  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    createHandleClick(
      inputReference,
      inputValue,
      config.placeholder,
      config.delimiter,
      config.segments,
      selectSegment,
    )(event)
  }

  // Handle input change with generic handler
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    createInputChangeHandler({
      config,
      inputRef: inputReference,
      inputValue,
      selectedSegment,
      selectSegmentFn: selectSegment,
      setCursorPosition: (pos) => {
        pendingCursorPosReference.current = pos
      },
      setInputValue,
      updateStore: setDateFromString,
    })(event)
  }

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    const bounds = getSegmentBounds(inputValue, config.delimiter, config.segments)
    if (!bounds) return

    // Block invalid characters to prevent selection loss
    if (!isValidInputChar(event.key, config.allowedCharsPattern)) {
      event.preventDefault()
      return
    }

    // Escape key - reset to initial value
    if (didHandleEscapeKey(event, inputReference, resetToInitial)) {
      return
    }

    // Backspace/Delete handling
    if (
      didHandleBackspaceDelete(
        event,
        inputReference,
        inputValue,
        config.delimiter,
        config.segments,
        bounds,
        config.segmentPlaceholders,
        setInputValue,
        setDateFromString,
        selectSegment,
      )
    ) {
      return
    }

    // Period/Dot key to move to next segment
    if (
      didHandleSeparatorKey(
        event,
        config.separatorKeys,
        inputReference,
        inputValue,
        config.delimiter,
        config.segments,
        selectSegment,
      )
    ) {
      return
    }

    // Helper: resolve segment at cursor position
    const segmentAtCursor = (): DateSegment | null => {
      const position = inputReference.current?.selectionStart
      if (typeof position !== 'number') return null
      return getSegmentFromPosition(position, inputValue, config.delimiter, config.segments)
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        // Arrow keys for increment/decrement
        event.preventDefault()
        if (!value.date) return
        const segment = segmentAtCursor()
        if (!segment) return

        const increment = event.key === 'ArrowUp' ? 1 : -1
        incrementBySegment(segment, increment)

        if (store) {
          setInputValue(store.getState().value.dateString)
        }
        setTimeout(() => selectSegment(segment), 0)

        break
      }
      case 'ArrowLeft':
      case 'ArrowRight': {
        // Arrow key navigation between segments at boundaries
        const position = inputReference.current?.selectionStart
        if (typeof position === 'number') {
          const segment = segmentAtCursor()
          if (segment) {
            const target = getArrowKeyTarget(event.key, position, segment, bounds, config.segments)
            if (target) {
              event.preventDefault()
              selectSegment(target)
            }
          }
        }

        break
      }
      case 'Tab': {
        // Tab navigation between segments
        const segment = segmentAtCursor()
        if (segment) {
          const target = getTabTarget(event.shiftKey, segment, config.segments)
          if (target) {
            event.preventDefault()
            selectSegment(target)
          }
        }

        break
      }
      // No default
    }
  }

  // Format on blur
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
    // Don't clear selection if clicking on arrow buttons (they have tabIndex=-1)
    const relatedTarget = event.relatedTarget as HTMLElement
    if (relatedTarget?.tagName === 'BUTTON' && relatedTarget.tabIndex === -1) {
      return
    }
    setSelectedSegment(null)

    // Ensure store is updated with current input value before formatting
    if (inputValue && inputValue !== value.dateString) {
      setDateFromString(inputValue)
    }

    // Sync display with store's formatted value (wait for next tick to ensure store updated)
    setTimeout(() => {
      if (value.date && value.isValid) {
        setInputValue(formatDate(value.date))
      } else {
        // If invalid or partial, show the store's dateString or placeholder
        setInputValue(value.dateString || config.placeholder)
      }
    }, 0)
  }

  // Handle focus
  const handleFocus = (): void => {
    if (inputValue === config.placeholder) {
      setInputValue('')
    } else if (inputValue && !focusFromMouseReference.current) {
      // Only auto-select first segment if focus came from keyboard (tab), not from mouse click
      setTimeout(() => selectSegment('day'), 0)
    }
    // Reset the flag after handling
    focusFromMouseReference.current = false
  }

  // Handle arrow button clicks
  const handleArrowClick = (direction: 'down' | 'up') => {
    // If no segment selected, default to incrementing the day (smallest common unit)
    const targetSegment = selectedSegment || 'day'
    const increment = direction === 'up' ? 1 : -1

    incrementBySegment(targetSegment, increment)

    // Update local input value immediately by reading fresh value from store
    if (store) {
      const updatedValue = store.getState().value
      setInputValue(updatedValue.dateString)
    }

    // Always select the segment that was incremented
    setTimeout(() => selectSegment(targetSegment), 0)
  }

  return (
    <SegmentedInputWrapper
      hasSelection={!!selectedSegment}
      label={t('formats.dateFormat', 'DD.MM.YYYY')}
      onArrowClick={handleArrowClick}>
      <>
        <Input
          className={`selection:bg-secondary selection:text-secondary-content join-item m-0 font-mono ${!value.isValid && !value.isPartial ? 'text-error' : ''}`}
          fullWidth={false}
          onBlur={handleBlur}
          onChange={handleInputChange}
          onClick={handleClick}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          placeholder={t('formats.dateFormat', 'DD.MM.YYYY')}
          ref={inputReference}
          size="md"
          style={{ fontSize: '0.95rem', width: 'calc(10ch + 1.6rem)' }}
          type="text"
          value={inputValue}
          variant="default"
        />
        {afterSlot}
      </>
    </SegmentedInputWrapper>
  )
}
