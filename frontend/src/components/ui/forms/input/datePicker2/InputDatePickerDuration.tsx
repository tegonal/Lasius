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
import { useFormContext } from 'react-hook-form'

import {
  addMinutesToDate,
  calculateDurationMinutes,
  formatDuration,
  parseDuration,
} from './shared/durationUtils'
import { SegmentedInputWrapper } from './shared/SegmentedInputWrapper'

type DurationSegment = 'hour' | 'minute'

export type InputDatePickerDurationProps = {
  startFieldName: string
  endFieldName: string
}

// Internal component that assumes form context is available
const InputDatePickerDurationInternal: React.FC<InputDatePickerDurationProps> = ({
  startFieldName,
  endFieldName,
}) => {
  const { t } = useTranslation('common')
  const parentFormContext = useRequiredFormContext() // This will throw if no context
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedSegment, setSelectedSegment] = useState<DurationSegment | null>(null)
  const focusFromArrowRef = useRef<boolean>(false)
  const arrowIncrementModeRef = useRef<'large' | 'small' | null>(null)

  const startValue = parentFormContext.watch(startFieldName)
  const endValue = parentFormContext.watch(endFieldName)

  // Calculate duration
  const durationMinutes = calculateDurationMinutes(
    startValue ? new Date(startValue) : null,
    endValue ? new Date(endValue) : null,
  )
  const durationString = formatDuration(durationMinutes)

  const [inputValue, setInputValue] = useState<string>(durationString)

  // Sync with calculated duration
  useEffect(() => {
    if (!inputRef.current?.matches(':focus')) {
      setInputValue(durationString)
    }
  }, [durationString])

  // Get segment boundaries in the string
  const getSegmentBounds = (
    value: string,
  ): { hour: { start: number; end: number }; minute: { start: number; end: number } } | null => {
    const colonIndex = value.indexOf(':')
    if (colonIndex === -1) return null

    return {
      hour: { start: 0, end: colonIndex },
      minute: { start: colonIndex + 1, end: value.length },
    }
  }

  // Determine which segment the cursor is in
  const getSegmentFromPosition = (position: number, value: string): DurationSegment | null => {
    const bounds = getSegmentBounds(value)
    if (!bounds) return null

    if (position <= bounds.hour.end) return 'hour'
    return 'minute'
  }

  // Select a segment
  const selectSegment = (segment: DurationSegment): void => {
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
      if (typeof position === 'number' && inputValue) {
        const segment = getSegmentFromPosition(position, inputValue)
        if (segment) {
          selectSegment(segment)
        }
      }
    }, 0)
  }

  // Update end time based on duration change
  const updateEndTime = (newDurationMinutes: number) => {
    if (startValue) {
      const startDate = new Date(startValue)
      const newEndDate = addMinutesToDate(startDate, newDurationMinutes)
      parentFormContext.setValue(endFieldName, newEndDate.toISOString(), {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Try to parse and update if valid
    const minutes = parseDuration(newValue)
    if (minutes !== null) {
      updateEndTime(minutes)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    const bounds = getSegmentBounds(inputValue)
    if (!bounds) return

    // Colon key to move to minute segment
    if (e.key === ':') {
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
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(position, inputValue) || 'minute'
        const increment = e.key === 'ArrowUp' ? 1 : -1

        let newMinutes = durationMinutes
        if (segment === 'hour') {
          newMinutes += increment * 60
        } else {
          newMinutes += increment
        }

        // Ensure duration doesn't go negative
        if (newMinutes >= 0) {
          updateEndTime(newMinutes)
          setTimeout(() => selectSegment(segment), 0)
        }
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
  }

  // Handle focus
  const handleFocus = (): void => {
    if (!focusFromArrowRef.current && inputValue) {
      // Only auto-select hour if focus came from user clicking, not from arrow buttons
      setTimeout(() => selectSegment('hour'), 0)
    }
    // Reset the flag after handling
    focusFromArrowRef.current = false
  }

  // Handle blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
    // Don't clear selection if clicking on arrow buttons
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget?.tagName === 'BUTTON') {
      return
    }
    setSelectedSegment(null)
    // Reset increment mode on blur
    arrowIncrementModeRef.current = null
    // Reset to calculated duration if invalid
    const minutes = parseDuration(inputValue)
    if (minutes === null) {
      setInputValue(durationString)
    }
  }

  // Handle arrow button clicks
  const handleArrowClick = (direction: 'up' | 'down') => {
    // Get fresh values to ensure we're working with the latest state
    const currentStartValue = parentFormContext.getValues(startFieldName)
    const currentEndValue = parentFormContext.getValues(endFieldName)

    // Recalculate current duration from fresh values
    const currentDurationMinutes = calculateDurationMinutes(
      currentStartValue ? new Date(currentStartValue) : null,
      currentEndValue ? new Date(currentEndValue) : null,
    )

    // Determine the target segment and increment mode (same as time input)
    let targetSegment: DurationSegment
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

    const baseIncrement = direction === 'up' ? 1 : -1
    const increment = baseIncrement * incrementAmount

    let newMinutes = currentDurationMinutes
    if (targetSegment === 'hour') {
      newMinutes += increment * 60
    } else {
      newMinutes += increment
    }

    // Ensure duration doesn't go negative
    if (newMinutes >= 0) {
      // Update based on fresh start value
      if (currentStartValue) {
        const startDate = new Date(currentStartValue)
        const newEndDate = addMinutesToDate(startDate, newMinutes)
        parentFormContext.setValue(endFieldName, newEndDate.toISOString(), {
          shouldValidate: true,
          shouldDirty: true,
        })

        // Immediately update the displayed duration
        const newDurationString = formatDuration(newMinutes)
        setInputValue(newDurationString)
      }

      // Set flag to indicate focus is from arrow
      focusFromArrowRef.current = true

      // Select the target segment
      setTimeout(() => {
        if (inputRef.current && !inputRef.current.matches(':focus')) {
          inputRef.current.focus()
        }
        selectSegment(targetSegment)
      }, 50)
    }
  }

  const isInvalid = durationMinutes < 0

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-col gap-2">
        <div>
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
              variant={isInvalid ? 'error' : 'default'}
              size="md"
              className={`m-0 w-[4.5rem] font-mono ${isInvalid ? 'text-error' : ''}`}
              fullWidth={false}
            />
          </SegmentedInputWrapper>
        </div>
        <span className="text-base-content/60 text-xs">
          {t('common.formats.durationFormat', { defaultValue: 'HH:MM' })}
        </span>
      </div>
      {isInvalid && (
        <span className="text-error mt-1 text-xs">
          {t('common.validation.endBeforeStart', { defaultValue: 'End time is before start time' })}
        </span>
      )}
    </div>
  )
}

// Export the wrapped version that handles missing context gracefully
export const InputDatePickerDuration: React.FC<InputDatePickerDurationProps> = (props) => {
  const formContext = useFormContext()

  if (!formContext) {
    console.warn('InputDatePickerDuration: No form context available')
    return null
  }

  return <InputDatePickerDurationInternal {...props} />
}
