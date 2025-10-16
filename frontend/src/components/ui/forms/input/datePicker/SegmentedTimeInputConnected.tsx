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

import { Input } from 'components/primitives/inputs/Input'
import { useTranslation } from 'next-i18next'
import React, { useContext, useEffect, useRef, useState } from 'react'

import {
  createHandleClick,
  getSegmentBounds,
  getSegmentFromPosition,
  selectSegment as selectSegmentHelper,
  TIME_SEGMENT_CONFIG,
  type TimeSegment,
} from './shared/core'
import { formatTimeString } from './shared/dateTimeHelpers'
import {
  createInputChangeHandler,
  handleBackspaceDelete,
  handleEscapeKey,
  handleSeparatorKey,
  validateInputChar,
} from './shared/input'
import { SegmentedInputWrapper } from './shared/SegmentedInputWrapper'
import { DatePickerStoreContext, useDatePickerStore } from './store/useDatePickerStore'

interface SegmentedTimeInputConnectedProps {
  afterSlot?: React.ReactNode
}

export const SegmentedTimeInputConnected: React.FC<SegmentedTimeInputConnectedProps> = ({
  afterSlot,
}) => {
  const { t } = useTranslation('common')
  const store = useContext(DatePickerStoreContext)
  const { value, setTimeFromString, incrementHours, incrementMinutes, resetToInitial } =
    useDatePickerStore()
  const [inputValue, setInputValue] = useState<string>(value.timeString)
  const [selectedSegment, setSelectedSegment] = useState<TimeSegment | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const focusFromArrowRef = useRef<boolean>(false)
  const focusFromMouseRef = useRef<boolean>(false)
  const arrowIncrementModeRef = useRef<'large' | 'small' | null>(null)
  const pendingCursorPosRef = useRef<number | null>(null)

  const config = TIME_SEGMENT_CONFIG

  // Sync with store
  useEffect(() => {
    if (value.timeString !== inputValue && !inputRef.current?.matches(':focus')) {
      setInputValue(value.timeString || config.placeholder)
    }
  }, [value.timeString, inputValue, config.placeholder])

  // Restore cursor position after inputValue changes (runs synchronously before paint)
  React.useLayoutEffect(() => {
    if (pendingCursorPosRef.current !== null && inputRef.current?.matches(':focus')) {
      const pos = pendingCursorPosRef.current
      pendingCursorPosRef.current = null
      inputRef.current.setSelectionRange(pos, pos)
    }
  }, [inputValue])

  // Select a segment using helper
  const selectSegment = (segment: TimeSegment): void => {
    selectSegmentHelper(
      segment,
      inputValue,
      config.delimiter,
      config.segments,
      inputRef,
      setSelectedSegment,
    )
  }

  // Handle mouse down to set flag before focus
  const handleMouseDown = () => {
    focusFromMouseRef.current = true
  }

  // Handle click using helper
  const handleClick = createHandleClick(
    inputRef,
    inputValue,
    config.placeholder,
    config.delimiter,
    config.segments,
    (segment) => {
      // Reset increment mode when user manually selects
      arrowIncrementModeRef.current = 'small'
      selectSegment(segment)
    },
  )

  // Handle input change with generic handler
  const handleInputChange = createInputChangeHandler({
    config,
    inputValue,
    selectedSegment,
    inputRef,
    setInputValue,
    updateStore: setTimeFromString,
    selectSegmentFn: selectSegment,
    setCursorPosition: (pos) => {
      pendingCursorPosRef.current = pos
    },
  })

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    const bounds = getSegmentBounds(inputValue, config.delimiter, config.segments)
    if (!bounds) return

    // Block invalid characters to prevent selection loss
    if (!validateInputChar(e.key, config.allowedCharsPattern)) {
      e.preventDefault()
      return
    }

    // Escape key - reset to initial value
    if (handleEscapeKey(e, inputRef, resetToInitial)) {
      return
    }

    // Backspace/Delete handling
    if (
      handleBackspaceDelete(
        e,
        inputRef,
        inputValue,
        config.delimiter,
        config.segments,
        bounds,
        config.segmentPlaceholders,
        setInputValue,
        setTimeFromString,
        selectSegment,
      )
    ) {
      return
    }

    // Colon or period key to move to minute segment
    if (
      handleSeparatorKey(
        e,
        config.separatorKeys,
        inputRef,
        inputValue,
        config.delimiter,
        config.segments,
        selectSegment,
      )
    ) {
      return
    }

    // Arrow keys for increment/decrement
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number' && value.date) {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (!segment) return

        const baseIncrement = e.key === 'ArrowUp' ? 1 : -1

        if (segment === 'hour') {
          // Hours: increment by 1, date-fns handles midnight crossing automatically!
          incrementHours(baseIncrement)
        } else if (segment === 'minute') {
          // Minutes: increment by 5, date-fns handles hour/day overflow automatically!
          incrementMinutes(baseIncrement * 5)
        }

        // Update local input value immediately by reading fresh value from store
        if (store) {
          const updatedValue = store.getState().value
          setInputValue(updatedValue.timeString)
        }

        setTimeout(() => selectSegment(segment), 0)
      }
    }

    // Tab navigation
    if (e.key === 'Tab' && !e.shiftKey) {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (segment === 'hour') {
          e.preventDefault()
          selectSegment('minute')
        }
        // When on minute (last segment), don't preventDefault - allow natural tab behavior
      }
    }

    if (e.key === 'Tab' && e.shiftKey) {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (segment === 'minute') {
          e.preventDefault()
          selectSegment('hour')
        }
        // When on hour (first segment) with Shift+Tab, don't preventDefault - allow natural tab behavior
      }
    }

    // Arrow key navigation
    if (e.key === 'ArrowLeft') {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (segment === 'minute' && position === bounds.minute.start) {
          e.preventDefault()
          selectSegment('hour')
        }
      }
    }

    if (e.key === 'ArrowRight') {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (segment === 'hour' && position === bounds.hour.end) {
          e.preventDefault()
          selectSegment('minute')
        }
      }
    }
  }

  // Format on blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
    // Don't clear selection if clicking on arrow buttons (they have tabIndex=-1)
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget?.tagName === 'BUTTON' && relatedTarget.tabIndex === -1) {
      return
    }
    setSelectedSegment(null)
    // Reset increment mode on blur
    arrowIncrementModeRef.current = null

    // Ensure store is updated with current input value before formatting
    if (inputValue && inputValue !== value.timeString) {
      setTimeFromString(inputValue)
    }

    // Sync display with store's formatted value (wait for next tick to ensure store updated)
    setTimeout(() => {
      if (value.date && value.isValid) {
        setInputValue(formatTimeString(value.date))
      } else {
        // If invalid or partial, show the store's timeString or placeholder
        setInputValue(value.timeString || config.placeholder)
      }
    }, 0)
  }

  // Handle focus
  const handleFocus = (): void => {
    if (inputValue === config.placeholder) {
      setInputValue('')
    } else if (inputValue && !focusFromArrowRef.current && !focusFromMouseRef.current) {
      // Only auto-select first segment if focus came from keyboard (tab), not from mouse click or arrow buttons
      setTimeout(() => selectSegment('hour'), 0)
    }
    // Reset the flags after handling
    focusFromArrowRef.current = false
    focusFromMouseRef.current = false
  }

  // Handle arrow button clicks
  const handleArrowClick = (direction: 'up' | 'down') => {
    // Determine the target segment
    const targetSegment: TimeSegment = selectedSegment === 'hour' ? 'hour' : 'minute'
    const baseIncrement = direction === 'up' ? 1 : -1

    // Use the date-fns powered increment functions
    if (targetSegment === 'hour') {
      incrementHours(baseIncrement)
    } else {
      incrementMinutes(baseIncrement * 5)
    }

    // Update local input value immediately by reading fresh value from store
    if (store) {
      const updatedValue = store.getState().value
      setInputValue(updatedValue.timeString)
    }

    // Set flag to indicate focus is from arrow
    focusFromArrowRef.current = true

    // Select the target segment
    setTimeout(() => {
      if (inputRef.current && !inputRef.current.matches(':focus')) {
        inputRef.current.focus()
      }
      selectSegment(targetSegment)
    }, 10)
  }

  return (
    <SegmentedInputWrapper
      onArrowClick={handleArrowClick}
      hasSelection={!!selectedSegment}
      label={t('common.formats.timeFormat', { defaultValue: 'HH:MM' })}>
      <>
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          placeholder={t('common.formats.timeFormat', { defaultValue: 'HH:MM' })}
          variant="default"
          size="md"
          className={`selection:bg-secondary selection:text-secondary-content join-item m-0 font-mono ${!value.isValid && !value.isPartial ? 'text-error' : ''}`}
          style={{ width: 'calc(5ch + 1.6rem)', fontSize: '0.95rem' }}
          fullWidth={false}
        />
        {afterSlot}
      </>
    </SegmentedInputWrapper>
  )
}
