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

import { formatTime, formatTimeString } from './shared/dateTimeHelpers'
import {
  createHandleClick,
  getSegmentBounds,
  getSegmentFromPosition,
  handleBackspaceDelete,
  handleEscapeKey,
  handleSeparatorKey,
  selectSegment as selectSegmentHelper,
  validateInputChar,
} from './shared/segmentedInputHelpers'
import { SegmentedInputWrapper } from './shared/SegmentedInputWrapper'
import { handleArrowIncrement } from './shared/segmentUtils'
import { useDatePickerStore } from './store/useDatePickerStore'

type TimeSegment = 'hour' | 'minute'

export const SegmentedTimeInputConnected = () => {
  const { t } = useTranslation('common')
  const { value, setTimeFromString, resetToInitial } = useDatePickerStore()
  const [inputValue, setInputValue] = useState<string>(value.timeString)
  const [selectedSegment, setSelectedSegment] = useState<TimeSegment | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const focusFromArrowRef = useRef<boolean>(false)
  const arrowIncrementModeRef = useRef<'large' | 'small' | null>(null)

  const TIME_DELIMITER = ':'
  const TIME_SEGMENTS: TimeSegment[] = ['hour', 'minute']
  const TIME_PLACEHOLDER = '__:__'
  const SEGMENT_PLACEHOLDERS: Record<TimeSegment, string> = {
    hour: '__',
    minute: '__',
  }

  // Sync with store
  useEffect(() => {
    if (value.timeString !== inputValue && !inputRef.current?.matches(':focus')) {
      setInputValue(value.timeString || TIME_PLACEHOLDER)
    }
  }, [value.timeString, inputValue])

  // Select a segment using helper
  const selectSegment = (segment: TimeSegment): void => {
    selectSegmentHelper(
      segment,
      inputValue,
      TIME_DELIMITER,
      TIME_SEGMENTS,
      inputRef,
      setSelectedSegment,
    )
  }

  // Handle click using helper
  const handleClick = createHandleClick(
    inputRef,
    inputValue,
    TIME_PLACEHOLDER,
    TIME_DELIMITER,
    TIME_SEGMENTS,
    (segment) => {
      // Reset increment mode when user manually selects
      arrowIncrementModeRef.current = 'small'
      selectSegment(segment)
    },
  )

  // Handle input change with segment awareness
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // Replace any periods with colons for easier typing
    let newValue = e.target.value.replace(/\./g, TIME_DELIMITER)
    const prevValue = inputValue

    // Smart input validation: only allow digits and colons
    if (newValue && !/^[\d:]*$/.test(newValue)) {
      // Block invalid characters by reverting to previous value
      return
    }

    // Check if we're replacing a segment
    if (selectedSegment && inputRef.current) {
      const bounds = getSegmentBounds(prevValue, TIME_DELIMITER, TIME_SEGMENTS)
      if (bounds) {
        const segmentBounds = bounds[selectedSegment]
        const selStart = inputRef.current.selectionStart
        const selEnd = inputRef.current.selectionEnd

        // If selection matches a segment, we're replacing it
        if (selStart === segmentBounds.start && selEnd === segmentBounds.end) {
          const parts = prevValue.split(TIME_DELIMITER)
          const typedChar = newValue.slice(selStart, selStart + 1)

          if (/\d/.test(typedChar)) {
            const digit = parseInt(typedChar, 10)

            // Smart overflow handling: auto-advance if first digit exceeds max possible
            if (selectedSegment === 'hour' && digit > 2) {
              // Hours can't start with > 2, so treat as single digit and advance
              parts[0] = typedChar.padStart(2, '0')
              const updatedValue = parts.join(TIME_DELIMITER)
              setInputValue(updatedValue)
              setTimeFromString(updatedValue)
              setTimeout(() => selectSegment('minute'), 0)
              return
            } else if (selectedSegment === 'minute' && digit > 5) {
              // Minutes can't start with > 5, so treat as single digit (no advance on last segment)
              parts[1] = typedChar.padStart(2, '0')
              const updatedValue = parts.join(TIME_DELIMITER)
              setInputValue(updatedValue)
              setTimeFromString(updatedValue)
              return
            }

            // Replace the segment with the typed digit
            if (selectedSegment === 'hour') {
              parts[0] = typedChar.padStart(2, '0')
            } else if (selectedSegment === 'minute') {
              parts[1] = typedChar.padStart(2, '0')
            }

            const updatedValue = parts.join(TIME_DELIMITER)
            setInputValue(updatedValue)
            setTimeFromString(updatedValue)

            // Move to next segment
            setTimeout(() => {
              if (selectedSegment === 'hour') selectSegment('minute')
            }, 0)

            return
          }
        }

        // If we're typing a digit and the segment already has a single digit
        if (/^\d$/.test(newValue.slice(-1)) && newValue.length > prevValue.length) {
          const parts = prevValue.split(TIME_DELIMITER)
          const newDigit = newValue.slice(-1)

          if (selectedSegment === 'hour' && /^\d$/.test(parts[0])) {
            parts[0] = parts[0] + newDigit
            const updatedValue = parts.join(TIME_DELIMITER)
            setInputValue(updatedValue)
            setTimeFromString(updatedValue)
            setTimeout(() => selectSegment('minute'), 0)
            return
          } else if (selectedSegment === 'minute' && /^\d$/.test(parts[1])) {
            parts[1] = parts[1] + newDigit
            const updatedValue = parts.join(TIME_DELIMITER)
            setInputValue(updatedValue)
            setTimeFromString(updatedValue)
            return
          }
        }
      }
    }

    // Default behavior
    setInputValue(newValue)
    setSelectedSegment(null)
    // Always update the store immediately so form has current state
    setTimeFromString(newValue)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    const bounds = getSegmentBounds(inputValue, TIME_DELIMITER, TIME_SEGMENTS)
    if (!bounds) return

    // Block invalid characters to prevent selection loss
    if (!validateInputChar(e.key, /[\d:.]/)) {
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
        TIME_DELIMITER,
        TIME_SEGMENTS,
        bounds,
        SEGMENT_PLACEHOLDERS,
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
        [':', '.'],
        inputRef,
        inputValue,
        TIME_DELIMITER,
        TIME_SEGMENTS,
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
        const segment = getSegmentFromPosition(position, inputValue, TIME_DELIMITER, TIME_SEGMENTS)
        if (!segment) return

        const newDate = new Date(value.date)
        const increment = e.key === 'ArrowUp' ? 1 : -1

        if (segment === 'hour') {
          newDate.setHours((newDate.getHours() + increment + 24) % 24)
        } else if (segment === 'minute') {
          newDate.setMinutes((newDate.getMinutes() + increment + 60) % 60)
        }

        const formatted = formatTime(newDate.getHours(), newDate.getMinutes())
        setInputValue(formatted)
        setTimeFromString(formatted)
        setTimeout(() => selectSegment(segment), 0)
      }
    }

    // Tab navigation
    if (e.key === 'Tab' && !e.shiftKey) {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue, TIME_DELIMITER, TIME_SEGMENTS)
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
        const segment = getSegmentFromPosition(position, inputValue, TIME_DELIMITER, TIME_SEGMENTS)
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
        const segment = getSegmentFromPosition(position, inputValue, TIME_DELIMITER, TIME_SEGMENTS)
        if (segment === 'minute' && position === bounds.minute.start) {
          e.preventDefault()
          selectSegment('hour')
        }
      }
    }

    if (e.key === 'ArrowRight') {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue, TIME_DELIMITER, TIME_SEGMENTS)
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
        setInputValue(value.timeString || TIME_PLACEHOLDER)
      }
    }, 0)
  }

  // Handle focus
  const handleFocus = (): void => {
    if (inputValue === TIME_PLACEHOLDER) {
      setInputValue('')
    } else if (inputValue && !focusFromArrowRef.current) {
      // Only auto-select hour if focus came from user clicking, not from arrow buttons
      setTimeout(() => selectSegment('hour'), 0)
    }
    // Reset the flag after handling
    focusFromArrowRef.current = false
  }

  // Handle arrow button clicks
  const handleArrowClick = (direction: 'up' | 'down') => {
    // Determine the target segment and increment mode
    let targetSegment: TimeSegment
    let incrementAmount: number

    if (selectedSegment === 'hour') {
      // Hour is explicitly selected
      targetSegment = 'hour'
      incrementAmount = 1
      arrowIncrementModeRef.current = 'small'
    } else if (selectedSegment === 'minute') {
      // Minute is explicitly selected - use the current mode or default to small
      targetSegment = 'minute'
      incrementAmount = arrowIncrementModeRef.current === 'large' ? 5 : 1
    } else {
      // No segment selected - use large increments for minutes
      targetSegment = 'minute'
      incrementAmount = 5
      arrowIncrementModeRef.current = 'large'
    }

    // If no date, create one from the current input or use current time
    let workingDate: Date
    if (value.date) {
      workingDate = new Date(value.date)
    } else if (inputValue && inputValue !== TIME_PLACEHOLDER) {
      // Try to parse the current input
      const parts = inputValue.split(TIME_DELIMITER)
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
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        placeholder={t('common.formats.timeFormat', { defaultValue: 'HH:MM' })}
        variant="default"
        size="md"
        className={`selection:bg-secondary selection:text-secondary-content join-item m-0 font-mono ${!value.isValid && !value.isPartial ? 'text-error' : ''}`}
        style={{ width: 'calc(5ch + 1.6rem)', fontSize: '0.95rem' }}
        fullWidth={false}
      />
    </SegmentedInputWrapper>
  )
}
