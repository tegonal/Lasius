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
import { useRequiredFormContext } from 'components/ui/forms/WithFormContext'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useRef, useState } from 'react'

import {
  createHandleClick,
  DURATION_SEGMENT_CONFIG,
  type DurationSegment,
  getSegmentBounds,
  getSegmentFromPosition,
  selectSegment as selectSegmentHelper,
} from './shared/core'
import {
  addMinutesToDate,
  calculateDurationMinutes,
  formatDuration,
  parseDuration,
} from './shared/durationUtils'
import {
  createInputChangeHandler,
  handleBackspaceDelete,
  handleEscapeKey,
  handleSeparatorKey,
  validateInputChar,
} from './shared/input'
import { SegmentedInputWrapper } from './shared/SegmentedInputWrapper'

interface SegmentedDurationInputConnectedProps {
  startFieldName: string
  endFieldName: string
}

export const SegmentedDurationInputConnected: React.FC<SegmentedDurationInputConnectedProps> = ({
  startFieldName,
  endFieldName,
}) => {
  const { t } = useTranslation('common')
  const parentFormContext = useRequiredFormContext()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedSegment, setSelectedSegment] = useState<DurationSegment | null>(null)
  const focusFromArrowRef = useRef<boolean>(false)
  const focusFromMouseRef = useRef<boolean>(false)
  const arrowIncrementModeRef = useRef<'large' | 'small' | null>(null)
  const initialDurationRef = useRef<number>(0)
  const pendingCursorPosRef = useRef<number | null>(null)

  const config = DURATION_SEGMENT_CONFIG

  const startValue = parentFormContext.watch(startFieldName)
  const endValue = parentFormContext.watch(endFieldName)

  // Calculate duration
  const durationMinutes = calculateDurationMinutes(
    startValue ? new Date(startValue) : null,
    endValue ? new Date(endValue) : null,
  )
  const durationString = formatDuration(durationMinutes)

  const [inputValue, setInputValue] = useState<string>(durationString)

  // Store initial duration when component mounts or start/end change externally
  useEffect(() => {
    if (!inputRef.current?.matches(':focus')) {
      initialDurationRef.current = durationMinutes
    }
  }, [durationMinutes])

  // Sync with calculated duration
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

  // Select a segment using helper
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

  // Update end time based on duration change
  const updateEndTime = (newDurationMinutes: number) => {
    if (startValue && newDurationMinutes >= 0) {
      const startDate = new Date(startValue)
      const newEndDate = addMinutesToDate(startDate, newDurationMinutes)
      parentFormContext.setValue(endFieldName, newEndDate.toISOString(), {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
  }

  // Reset to initial duration
  const resetToInitial = () => {
    updateEndTime(initialDurationRef.current)
    setInputValue(formatDuration(initialDurationRef.current))
  }

  // Handle input change using shared utility
  const handleInputChange = createInputChangeHandler({
    config,
    inputValue,
    selectedSegment,
    inputRef,
    setInputValue,
    updateStore: (value: string) => {
      const minutes = parseDuration(value)
      if (minutes !== null) {
        updateEndTime(minutes)
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
        (value) => {
          const minutes = parseDuration(value)
          if (minutes !== null) {
            updateEndTime(minutes)
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
          updateEndTime(newMinutes)
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
    // Don't clear selection if clicking on arrow buttons (tabIndex=-1)
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget?.tagName === 'BUTTON' && relatedTarget.tabIndex === -1) {
      return
    }
    setSelectedSegment(null)
    // Reset increment mode on blur
    arrowIncrementModeRef.current = null

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
      // Only auto-select first segment if focus came from keyboard (tab), not from mouse click or arrow buttons
      setTimeout(() => selectSegment('hour'), 0)
    }
    // Reset the flags after handling
    focusFromArrowRef.current = false
    focusFromMouseRef.current = false
  }

  // Handle arrow button clicks
  const handleArrowClick = (direction: 'up' | 'down') => {
    // Get fresh values
    const currentStartValue = parentFormContext.getValues(startFieldName)
    const currentEndValue = parentFormContext.getValues(endFieldName)

    // Recalculate current duration
    const currentDurationMinutes = calculateDurationMinutes(
      currentStartValue ? new Date(currentStartValue) : null,
      currentEndValue ? new Date(currentEndValue) : null,
    )

    // Determine the target segment and increment amount
    let targetSegment: DurationSegment
    let incrementAmount: number

    if (selectedSegment === 'hour') {
      // Hour is selected - increment by 1 hour
      targetSegment = 'hour'
      incrementAmount = 60
    } else {
      // Minute is selected or no selection - increment by 5 minutes
      targetSegment = 'minute'
      incrementAmount = 5
    }

    const baseIncrement = direction === 'up' ? 1 : -1
    let newMinutes = currentDurationMinutes + baseIncrement * incrementAmount

    // Ensure duration doesn't go negative
    if (newMinutes >= 0) {
      updateEndTime(newMinutes)
      const formatted = formatDuration(newMinutes)
      setInputValue(formatted)

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
  }

  const isInvalid = durationMinutes < 0

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
        variant={isInvalid ? 'error' : 'default'}
        size="md"
        className={`selection:bg-secondary selection:text-secondary-content join-item m-0 font-mono ${isInvalid ? 'text-error' : ''}`}
        style={{ width: 'calc(5ch + 1.6rem)', fontSize: '0.95rem' }}
        fullWidth={false}
      />
    </SegmentedInputWrapper>
  )
}
