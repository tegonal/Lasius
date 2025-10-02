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
import React, { useEffect, useRef, useState } from 'react'

import {
  createHandleClick,
  getSegmentBounds,
  getSegmentFromPosition,
  selectSegment as selectSegmentHelper,
  TIME_SEGMENT_CONFIG,
  type TimeSegment,
} from './shared/core'
import { formatTime, formatTimeString } from './shared/dateTimeHelpers'
import {
  createInputChangeHandler,
  handleBackspaceDelete,
  handleEscapeKey,
  handleSeparatorKey,
  validateInputChar,
} from './shared/input'
import { SegmentedInputWrapper } from './shared/SegmentedInputWrapper'
import { handleArrowIncrement } from './shared/segmentUtils'
import { useDatePickerStore } from './store/useDatePickerStore'

interface SegmentedTimeInputConnectedProps {
  afterSlot?: React.ReactNode
}

export const SegmentedTimeInputConnected: React.FC<SegmentedTimeInputConnectedProps> = ({
  afterSlot,
}) => {
  const { t } = useTranslation('common')
  const { value, setTimeFromString, resetToInitial } = useDatePickerStore()
  const [inputValue, setInputValue] = useState<string>(value.timeString)
  const [selectedSegment, setSelectedSegment] = useState<TimeSegment | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const focusFromArrowRef = useRef<boolean>(false)
  const focusFromMouseRef = useRef<boolean>(false)
  const arrowIncrementModeRef = useRef<'large' | 'small' | null>(null)

  const config = TIME_SEGMENT_CONFIG

  // Sync with store
  useEffect(() => {
    if (value.timeString !== inputValue && !inputRef.current?.matches(':focus')) {
      setInputValue(value.timeString || config.placeholder)
    }
  }, [value.timeString, inputValue, config.placeholder])

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

        const newDate = new Date(value.date)
        const baseIncrement = e.key === 'ArrowUp' ? 1 : -1

        if (segment === 'hour') {
          // Hours: increment by 1
          newDate.setHours(newDate.getHours() + baseIncrement)
        } else if (segment === 'minute') {
          // Minutes: increment by 5, automatically handles hour overflow/underflow
          newDate.setMinutes(newDate.getMinutes() + baseIncrement * 5)
        }

        // Get the updated hours and minutes after the date operations
        const updatedHours = newDate.getHours()
        const updatedMinutes = newDate.getMinutes()
        const formatted = formatTime(updatedHours, updatedMinutes)

        setInputValue(formatted)
        setTimeFromString(formatted)
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
    // Determine the target segment and increment amount
    let targetSegment: TimeSegment
    let incrementAmount: number

    if (selectedSegment === 'hour') {
      // Hour is explicitly selected - increment by 1
      targetSegment = 'hour'
      incrementAmount = 1
    } else {
      // Minute is selected or no selection - increment by 5
      targetSegment = 'minute'
      incrementAmount = 5
    }

    // If no date, create one from the current input or use current time
    let workingDate: Date
    if (value.date) {
      workingDate = new Date(value.date)
    } else if (inputValue && inputValue !== config.placeholder) {
      // Try to parse the current input
      const parts = inputValue.split(config.delimiter)
      if (parts.length === 2) {
        const [h, m] = parts
        const hours = parseInt(h, 10) || 0
        const minutes = parseInt(m, 10) || 0
        workingDate = new Date()
        workingDate.setHours(hours, minutes, 0, 0)
      } else {
        workingDate = new Date()
      }
    } else {
      workingDate = new Date()
    }

    const baseIncrement = direction === 'up' ? 1 : -1
    const increment = baseIncrement * incrementAmount

    if (targetSegment === 'minute' && incrementAmount === 5) {
      // For 5-minute increments, round to nearest 5 first
      const currentMinutes = workingDate.getMinutes()
      const roundedMinutes = Math.round(currentMinutes / 5) * 5
      workingDate.setMinutes(roundedMinutes)
      workingDate.setMinutes(workingDate.getMinutes() + increment)
    } else {
      workingDate = handleArrowIncrement(workingDate, targetSegment, baseIncrement)
    }

    const formatted = formatTime(workingDate.getHours(), workingDate.getMinutes())
    setInputValue(formatted)
    setTimeFromString(formatted)

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
