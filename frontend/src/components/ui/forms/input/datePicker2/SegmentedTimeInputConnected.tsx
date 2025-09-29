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
import React, { useEffect, useRef, useState } from 'react'

import { formatTime, formatTimeString } from './shared/dateTimeHelpers'
import { SegmentedInputWrapper } from './shared/SegmentedInputWrapper'
import { handleArrowIncrement } from './shared/segmentUtils'
import { useDatePickerStore } from './store/useDatePickerStore'

type TimeSegment = 'hour' | 'minute'

type SegmentBounds = {
  hour: { start: number; end: number }
  minute: { start: number; end: number }
}

export const SegmentedTimeInputConnected = () => {
  const { value, setTimeFromString } = useDatePickerStore()
  const [inputValue, setInputValue] = useState<string>(value.timeString)
  const [selectedSegment, setSelectedSegment] = useState<TimeSegment | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const focusFromArrowRef = useRef<boolean>(false)
  const arrowIncrementModeRef = useRef<'large' | 'small' | null>(null)

  // Sync with store
  useEffect(() => {
    if (value.timeString !== inputValue && !inputRef.current?.matches(':focus')) {
      setInputValue(value.timeString || '__:__')
    }
  }, [value.timeString, inputValue])

  // Get segment boundaries in the string
  const getSegmentBounds = (value: string): SegmentBounds | null => {
    const parts = value.split(':')
    if (parts.length !== 2) return null

    const hourEnd = parts[0].length
    const minuteEnd = hourEnd + 1 + parts[1].length

    return {
      hour: { start: 0, end: hourEnd },
      minute: { start: hourEnd + 1, end: minuteEnd },
    }
  }

  // Determine which segment the cursor is in
  const getSegmentFromPosition = (position: number, value: string): TimeSegment | null => {
    const bounds = getSegmentBounds(value)
    if (!bounds) return null

    if (position <= bounds.hour.end) return 'hour'
    return 'minute'
  }

  // Select a segment
  const selectSegment = (segment: TimeSegment): void => {
    const bounds = getSegmentBounds(inputValue)
    if (!bounds || !inputRef.current) return

    const segmentBounds = bounds[segment]
    if (!segmentBounds) return

    inputRef.current.focus()
    inputRef.current.setSelectionRange(segmentBounds.start, segmentBounds.end)
    setSelectedSegment(segment)
  }

  // Handle click to select segment
  const handleClick = (_e: React.MouseEvent<HTMLInputElement>): void => {
    // Reset increment mode when user manually selects
    arrowIncrementModeRef.current = 'small'
    setTimeout(() => {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number' && inputValue && inputValue !== '__:__') {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment) {
          selectSegment(segment)
        }
      }
    }, 0)
  }

  // Handle input change with segment awareness
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // Replace any periods with colons for easier typing
    const newValue = e.target.value.replace(/\./g, ':')
    const prevValue = inputValue

    // Check if we're replacing a segment
    if (selectedSegment && inputRef.current) {
      const bounds = getSegmentBounds(prevValue)
      if (bounds) {
        const segmentBounds = bounds[selectedSegment]
        const selStart = inputRef.current.selectionStart
        const selEnd = inputRef.current.selectionEnd

        // If selection matches a segment, we're replacing it
        if (selStart === segmentBounds.start && selEnd === segmentBounds.end) {
          const parts = prevValue.split(':')
          const typedChar = newValue.slice(selStart, selStart + 1)

          if (/\d/.test(typedChar)) {
            // Replace the segment with the typed digit
            if (selectedSegment === 'hour') {
              parts[0] = typedChar.padStart(2, '0')
            } else if (selectedSegment === 'minute') {
              parts[1] = typedChar.padStart(2, '0')
            }

            const updatedValue = parts.join(':')
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
          const parts = prevValue.split(':')
          const newDigit = newValue.slice(-1)

          if (selectedSegment === 'hour' && /^\d$/.test(parts[0])) {
            parts[0] = parts[0] + newDigit
            const updatedValue = parts.join(':')
            setInputValue(updatedValue)
            setTimeFromString(updatedValue)
            setTimeout(() => selectSegment('minute'), 0)
            return
          } else if (selectedSegment === 'minute' && /^\d$/.test(parts[1])) {
            parts[1] = parts[1] + newDigit
            const updatedValue = parts.join(':')
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
    const bounds = getSegmentBounds(inputValue)
    if (!bounds) return

    // Colon or period key to move to minute segment
    if (e.key === ':' || e.key === '.') {
      e.preventDefault()
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment === 'hour') selectSegment('minute')
      }
    }

    // Arrow keys for increment/decrement
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number' && value.date) {
        const segment = getSegmentFromPosition(position, inputValue)
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
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment === 'hour') {
          e.preventDefault()
          selectSegment('minute')
        }
      }
    }

    if (e.key === 'Tab' && e.shiftKey) {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment === 'minute') {
          e.preventDefault()
          selectSegment('hour')
        }
      }
    }

    // Arrow key navigation
    if (e.key === 'ArrowLeft') {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment === 'minute' && position === bounds.minute.start) {
          e.preventDefault()
          selectSegment('hour')
        }
      }
    }

    if (e.key === 'ArrowRight') {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment === 'hour' && position === bounds.hour.end) {
          e.preventDefault()
          selectSegment('minute')
        }
      }
    }
  }

  // Format on blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
    // Don't clear selection if clicking on arrow buttons
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget?.tagName === 'BUTTON') {
      return
    }
    setSelectedSegment(null)
    // Reset increment mode on blur
    arrowIncrementModeRef.current = null
    // Format display if we have a valid date
    if (value.date && value.isValid) {
      setInputValue(formatTimeString(value.date))
    }
  }

  // Handle focus
  const handleFocus = (): void => {
    if (inputValue === '__:__') {
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
    } else if (inputValue && inputValue !== '__:__') {
      // Try to parse the current input
      const parts = inputValue.split(':')
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
    <SegmentedInputWrapper onArrowClick={handleArrowClick} hasSelection={!!selectedSegment}>
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        placeholder="HH:MM"
        variant="default"
        size="md"
        className={`join-item m-0 w-[4.5rem] font-mono ${!value.isValid && !value.isPartial ? 'text-error' : ''}`}
        fullWidth={false}
      />
    </SegmentedInputWrapper>
  )
}
