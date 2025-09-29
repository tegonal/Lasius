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

import { formatDate } from './shared/dateTimeHelpers'
import { SegmentedInputWrapper } from './shared/SegmentedInputWrapper'
import { handleArrowIncrement } from './shared/segmentUtils'
import { useDatePickerStore } from './store/useDatePickerStore'

type DateSegment = 'day' | 'month' | 'year'

type SegmentBounds = {
  day: { start: number; end: number }
  month: { start: number; end: number }
  year: { start: number; end: number }
}

export const SegmentedDateInputConnected = () => {
  const { value, setDateFromString } = useDatePickerStore()
  const [inputValue, setInputValue] = useState<string>(value.dateString)
  const [selectedSegment, setSelectedSegment] = useState<DateSegment | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync with store
  useEffect(() => {
    if (value.dateString !== inputValue && !inputRef.current?.matches(':focus')) {
      setInputValue(value.dateString || '__.__.____')
    }
  }, [value.dateString, inputValue])

  // Get segment boundaries in the string
  const getSegmentBounds = (value: string): SegmentBounds | null => {
    const parts = value.split('.')
    if (parts.length !== 3) return null

    const dayEnd = parts[0].length
    const monthEnd = dayEnd + 1 + parts[1].length
    const yearEnd = monthEnd + 1 + parts[2].length

    return {
      day: { start: 0, end: dayEnd },
      month: { start: dayEnd + 1, end: monthEnd },
      year: { start: monthEnd + 1, end: yearEnd },
    }
  }

  // Determine which segment the cursor is in
  const getSegmentFromPosition = (position: number, value: string): DateSegment | null => {
    const bounds = getSegmentBounds(value)
    if (!bounds) return null

    if (position <= bounds.day.end) return 'day'
    if (position <= bounds.month.end) return 'month'
    return 'year'
  }

  // Select a segment
  const selectSegment = (segment: DateSegment): void => {
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
    setTimeout(() => {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number' && inputValue && inputValue !== '__.__.____') {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment) {
          selectSegment(segment)
        }
      }
    }, 0)
  }

  // Handle input change with segment awareness
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value
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
          const parts = prevValue.split('.')
          const typedChar = newValue.slice(selStart, selStart + 1)

          if (/\d/.test(typedChar)) {
            // Replace the segment with the typed digit
            if (selectedSegment === 'day') {
              parts[0] = typedChar.padStart(2, '0')
            } else if (selectedSegment === 'month') {
              parts[1] = typedChar.padStart(2, '0')
            } else if (selectedSegment === 'year') {
              parts[2] = typedChar
            }

            const updatedValue = parts.join('.')
            setInputValue(updatedValue)
            setDateFromString(updatedValue)

            // Move to next segment
            setTimeout(() => {
              if (selectedSegment === 'day') selectSegment('month')
              else if (selectedSegment === 'month') selectSegment('year')
            }, 0)

            return
          }
        }

        // If we're typing a digit and the segment already has a single digit
        if (/^\d$/.test(newValue.slice(-1)) && newValue.length > prevValue.length) {
          const parts = prevValue.split('.')
          const newDigit = newValue.slice(-1)

          if (selectedSegment === 'day' && /^\d$/.test(parts[0])) {
            parts[0] = parts[0] + newDigit
            const updatedValue = parts.join('.')
            setInputValue(updatedValue)
            setDateFromString(updatedValue)
            setTimeout(() => selectSegment('month'), 0)
            return
          } else if (selectedSegment === 'month' && /^\d$/.test(parts[1])) {
            parts[1] = parts[1] + newDigit
            const updatedValue = parts.join('.')
            setInputValue(updatedValue)
            setDateFromString(updatedValue)
            setTimeout(() => selectSegment('year'), 0)
            return
          } else if (selectedSegment === 'year') {
            parts[2] = parts[2] + newDigit
            const updatedValue = parts.join('.')
            setInputValue(updatedValue)
            setDateFromString(updatedValue)
            return
          }
        }
      }
    }

    // Default behavior
    setInputValue(newValue)
    setSelectedSegment(null)
    // Always update the store immediately so form has current state
    setDateFromString(newValue)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    const bounds = getSegmentBounds(inputValue)
    if (!bounds) return

    // Period/Dot key to move to next segment
    if (e.key === '.' || e.key === ',') {
      e.preventDefault()
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment === 'day') selectSegment('month')
        else if (segment === 'month') selectSegment('year')
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

        if (segment === 'day') {
          newDate.setDate(newDate.getDate() + increment)
        } else if (segment === 'month') {
          newDate.setMonth(newDate.getMonth() + increment)
        } else if (segment === 'year') {
          newDate.setFullYear(newDate.getFullYear() + increment)
        }

        const formatted = formatDate(newDate)
        setInputValue(formatted)
        setDateFromString(formatted)
        setTimeout(() => selectSegment(segment), 0)
      }
    }

    // Tab navigation
    if (e.key === 'Tab' && !e.shiftKey) {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment === 'day') {
          e.preventDefault()
          selectSegment('month')
        } else if (segment === 'month') {
          e.preventDefault()
          selectSegment('year')
        }
      }
    }

    if (e.key === 'Tab' && e.shiftKey) {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment === 'year') {
          e.preventDefault()
          selectSegment('month')
        } else if (segment === 'month') {
          e.preventDefault()
          selectSegment('day')
        }
      }
    }

    // Arrow key navigation
    if (e.key === 'ArrowLeft') {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment === 'year' && position === bounds.year.start) {
          e.preventDefault()
          selectSegment('month')
        } else if (segment === 'month' && position === bounds.month.start) {
          e.preventDefault()
          selectSegment('day')
        }
      }
    }

    if (e.key === 'ArrowRight') {
      const position = inputRef.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment === 'day' && position === bounds.day.end) {
          e.preventDefault()
          selectSegment('month')
        } else if (segment === 'month' && position === bounds.month.end) {
          e.preventDefault()
          selectSegment('year')
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
    // Format display if we have a valid date
    if (value.date && value.isValid) {
      setInputValue(formatDate(value.date))
    }
  }

  // Handle focus
  const handleFocus = (): void => {
    if (inputValue === '__.__.____') {
      setInputValue('')
    } else if (inputValue) {
      setTimeout(() => selectSegment('day'), 0)
    }
  }

  // Handle arrow button clicks
  const handleArrowClick = (direction: 'up' | 'down') => {
    // If no segment selected, default to incrementing the day (smallest common unit)
    const targetSegment = selectedSegment || 'day'

    // If no date, create one from the current input or use today
    let workingDate: Date
    if (value.date) {
      workingDate = new Date(value.date)
    } else if (inputValue && inputValue !== '__.__.____') {
      // Try to parse the current input
      const parts = inputValue.split('.')
      if (parts.length === 3) {
        const [d, m, y] = parts
        const day = parseInt(d, 10) || 1
        const month = parseInt(m, 10) || 1
        const year = parseInt(y, 10) || new Date().getFullYear()
        workingDate = new Date(year, month - 1, day)
      } else {
        workingDate = new Date()
      }
    } else {
      workingDate = new Date()
    }

    const increment = direction === 'up' ? 1 : -1
    workingDate = handleArrowIncrement(workingDate, targetSegment, increment)

    const formatted = formatDate(workingDate)
    setInputValue(formatted)
    setDateFromString(formatted)

    // Always select the segment that was incremented
    setTimeout(() => selectSegment(targetSegment as DateSegment), 0)
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
        placeholder="DD.MM.YYYY"
        variant="default"
        size="md"
        className={`join-item m-0 w-[7rem] font-mono ${!value.isValid && !value.isPartial ? 'text-error' : ''}`}
        fullWidth={false}
      />
    </SegmentedInputWrapper>
  )
}
