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
  DURATION_SEGMENT_CONFIG,
  type DurationSegment,
  getSegmentBounds,
  getSegmentFromPosition,
  selectSegment as selectSegmentHelper,
} from './datePicker/shared/core'
import { formatDuration, parseDuration } from './datePicker/shared/durationUtils'
import {
  createInputChangeHandler,
  handleBackspaceDelete,
  handleEscapeKey,
  handleSeparatorKey,
  validateInputChar,
} from './datePicker/shared/input'
import { SegmentedInputWrapper } from './datePicker/shared/SegmentedInputWrapper'

interface DurationInputProps {
  value: number // value in milliseconds
  onChange: (milliseconds: number) => void
  id?: string
  error?: boolean
}

/**
 * Interactive duration input component with HH:MM format and arrow controls.
 * Works with milliseconds internally but displays as hours:minutes.
 * Use this instead of DurationInputMinutes for new implementations.
 */
export const DurationInput: React.FC<DurationInputProps> = ({ value, onChange, id, error }) => {
  const { t } = useTranslation('common')
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedSegment, setSelectedSegment] = useState<DurationSegment | null>(null)
  const focusFromArrowRef = useRef<boolean>(false)
  const focusFromMouseRef = useRef<boolean>(false)
  const initialDurationRef = useRef<number>(0)
  const pendingCursorPosRef = useRef<number | null>(null)

  const config = DURATION_SEGMENT_CONFIG

  // Convert milliseconds to minutes for display
  const durationMinutes = Math.round(value / 60000)
  const durationString = formatDuration(durationMinutes)

  const [inputValue, setInputValue] = useState<string>(durationString)

  // Store initial duration when component mounts or value changes externally
  useEffect(() => {
    if (!inputRef.current?.matches(':focus')) {
      initialDurationRef.current = durationMinutes
    }
  }, [durationMinutes])

  // Sync with external value
  useEffect(() => {
    if (!inputRef.current?.matches(':focus')) {
      setInputValue(durationString)
    }
  }, [durationString])

  // Restore cursor position after inputValue changes (runs synchronously before paint)
  React.useLayoutEffect(() => {
    if (pendingCursorPosRef.current !== null && inputRef.current?.matches(':focus')) {
      const pos = pendingCursorPosRef.current
      pendingCursorPosRef.current = null
      inputRef.current.setSelectionRange(pos, pos)
    }
  }, [inputValue])

  // Select a segment
  const selectSegment = (segment: DurationSegment): void => {
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

  // Handle click
  const handleClick = createHandleClick(
    inputRef,
    inputValue,
    config.placeholder,
    config.delimiter,
    config.segments,
    (segment) => {
      selectSegment(segment)
    },
  )

  // Update duration
  const updateDuration = (newDurationMinutes: number) => {
    if (newDurationMinutes >= 0) {
      onChange(newDurationMinutes * 60000)
    }
  }

  // Reset to initial duration
  const resetToInitial = () => {
    updateDuration(initialDurationRef.current)
    setInputValue(formatDuration(initialDurationRef.current))
  }

  // Handle input change
  const handleInputChange = createInputChangeHandler({
    config,
    inputValue,
    selectedSegment,
    inputRef,
    setInputValue,
    updateStore: (value: string) => {
      const minutes = parseDuration(value)
      if (minutes !== null) {
        updateDuration(minutes)
      }
    },
    selectSegmentFn: selectSegment,
    setCursorPosition: (pos) => {
      pendingCursorPosRef.current = pos
    },
  })

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    const bounds = getSegmentBounds(inputValue, config.delimiter, config.segments)
    if (!bounds) return

    // Block invalid characters
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
        (value) => {
          const minutes = parseDuration(value)
          if (minutes !== null) {
            updateDuration(minutes)
          }
        },
        selectSegment,
      )
    ) {
      return
    }

    // Separator key to move to next segment
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
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (!segment) return

        const baseIncrement = e.key === 'ArrowUp' ? 1 : -1
        let newMinutes = durationMinutes

        if (segment === 'hour') {
          // Hours: increment by 1 hour (60 minutes)
          newMinutes += baseIncrement * 60
        } else {
          // Minutes: increment by 5 minutes
          newMinutes += baseIncrement * 5
        }

        // Ensure duration doesn't go negative
        if (newMinutes >= 0) {
          updateDuration(newMinutes)
          const formatted = formatDuration(newMinutes)
          setInputValue(formatted)
          setTimeout(() => selectSegment(segment), 0)
        }
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

  // Handle blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
    // Don't clear selection if clicking on arrow buttons
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget?.tagName === 'BUTTON' && relatedTarget.tabIndex === -1) {
      return
    }
    setSelectedSegment(null)

    // Reset to calculated duration if invalid
    const minutes = parseDuration(inputValue)
    if (minutes === null) {
      setInputValue(durationString)
    } else {
      // Format to ensure consistency
      setInputValue(formatDuration(minutes))
    }
  }

  // Handle focus
  const handleFocus = (): void => {
    if (inputValue === config.placeholder) {
      setInputValue('')
    } else if (inputValue && !focusFromArrowRef.current && !focusFromMouseRef.current) {
      setTimeout(() => selectSegment('hour'), 0)
    }
    focusFromArrowRef.current = false
    focusFromMouseRef.current = false
  }

  // Handle arrow button clicks
  const handleArrowClick = (direction: 'up' | 'down') => {
    let targetSegment: DurationSegment
    let incrementAmount: number

    if (selectedSegment === 'hour') {
      targetSegment = 'hour'
      incrementAmount = 60
    } else {
      targetSegment = 'minute'
      incrementAmount = 5
    }

    const baseIncrement = direction === 'up' ? 1 : -1
    let newMinutes = durationMinutes + baseIncrement * incrementAmount

    if (newMinutes >= 0) {
      updateDuration(newMinutes)
      const formatted = formatDuration(newMinutes)
      setInputValue(formatted)

      focusFromArrowRef.current = true

      setTimeout(() => {
        if (inputRef.current && !inputRef.current.matches(':focus')) {
          inputRef.current.focus()
        }
        selectSegment(targetSegment)
      }, 10)
    }
  }

  return (
    <SegmentedInputWrapper
      onArrowClick={handleArrowClick}
      hasSelection={!!selectedSegment}
      label={t('common.formats.durationFormat', { defaultValue: 'HH:MM' })}>
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
        placeholder={t('common.formats.durationFormat', { defaultValue: 'HH:MM' })}
        variant={error ? 'error' : 'default'}
        size="md"
        className={`selection:bg-secondary selection:text-secondary-content join-item m-0 font-mono ${error ? 'text-error' : ''}`}
        style={{ width: 'calc(5ch + 1.6rem)', fontSize: '0.95rem' }}
        fullWidth={false}
        id={id}
      />
    </SegmentedInputWrapper>
  )
}
