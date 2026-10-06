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

import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/primitives/inputs/input'

import { getSegmentBounds, getSegmentFromPosition } from './date-picker/shared/core/segment-bounds'
import {
  DURATION_SEGMENT_CONFIG,
  type DurationSegment,
} from './date-picker/shared/core/segment-config'
import {
  createHandleClick,
  selectSegment as selectSegmentHelper,
} from './date-picker/shared/core/segment-selection'
import { formatDuration, parseDuration } from './date-picker/shared/duration-utilities'
import { createInputChangeHandler } from './date-picker/shared/input/input-change-handler'
import { isValidInputChar } from './date-picker/shared/input/input-validation'
import {
  didHandleBackspaceDelete,
  didHandleEscapeKey,
  didHandleSeparatorKey,
} from './date-picker/shared/input/keyboard-handlers'
import { SegmentedInputWrapper } from './date-picker/shared/segmented-input-wrapper'
import { useRestoreCursorPosition } from './date-picker/shared/use-restore-cursor-position'

type DurationInputProperties = {
  error?: boolean
  id?: string
  onChange: (milliseconds: number) => void
  value: number // value in milliseconds
}

/**
 * Interactive duration input component with HH:MM format and arrow controls.
 * Works with milliseconds internally but displays as hours:minutes.
 */
export const DurationInput = ({ error, id, onChange, value }: DurationInputProperties) => {
  const { t } = useTranslation('common')
  const inputReference = useRef<HTMLInputElement>(null)
  const [selectedSegment, setSelectedSegment] = useState<DurationSegment | null>(null)
  const focusFromArrowReference = useRef<boolean>(false)
  const focusFromMouseReference = useRef<boolean>(false)
  const initialDurationReference = useRef<number>(0)

  const config = DURATION_SEGMENT_CONFIG

  // Convert milliseconds to minutes for display
  const durationMinutes = Math.round(value / 60_000)
  const durationString = formatDuration(durationMinutes)

  const [inputValue, setInputValue] = useState<string>(durationString)
  const setCursorPosition = useRestoreCursorPosition(inputReference, inputValue)

  // Store initial duration when component mounts or value changes externally
  useEffect(() => {
    if (!inputReference.current?.matches(':focus')) {
      initialDurationReference.current = durationMinutes
    }
  }, [durationMinutes])

  // Sync with external value
  useEffect(() => {
    if (!inputReference.current?.matches(':focus')) {
      setInputValue(durationString)
    }
  }, [durationString])

  // Select a segment
  const selectSegment = (segment: DurationSegment): void => {
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

  // Handle click
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

  // Update duration
  const updateDuration = (newDurationMinutes: number) => {
    if (newDurationMinutes >= 0) {
      onChange(newDurationMinutes * 60_000)
    }
  }

  // Reset to initial duration
  const resetToInitial = () => {
    updateDuration(initialDurationReference.current)
    setInputValue(formatDuration(initialDurationReference.current))
  }

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    createInputChangeHandler({
      config,
      inputRef: inputReference,
      inputValue,
      selectedSegment,
      selectSegmentFn: selectSegment,
      setCursorPosition,
      setInputValue,
      updateStore: (value_: string) => {
        const minutes = parseDuration(value_)
        if (minutes !== null) {
          updateDuration(minutes)
        }
      },
    })(event)
  }

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    const bounds = getSegmentBounds(inputValue, config.delimiter, config.segments)
    if (!bounds) return

    // Block invalid characters
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
        (value_) => {
          const minutes = parseDuration(value_)
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

    // Arrow keys for increment/decrement
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const position = inputReference.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (!segment) return

        const baseIncrement = event.key === 'ArrowUp' ? 1 : -1
        let newMinutes = durationMinutes

        newMinutes += baseIncrement * (segment === 'hour' ? 60 : 5)

        if (newMinutes >= 0) {
          updateDuration(newMinutes)
          const formatted = formatDuration(newMinutes)
          setInputValue(formatted)
          setTimeout(() => selectSegment(segment), 0)
        }
      }
    }

    // Tab navigation
    if (event.key === 'Tab' && !event.shiftKey) {
      const position = inputReference.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (segment === 'hour') {
          event.preventDefault()
          selectSegment('minute')
        }
      }
    }

    if (event.key === 'Tab' && event.shiftKey) {
      const position = inputReference.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (segment === 'minute') {
          event.preventDefault()
          selectSegment('hour')
        }
      }
    }

    // Arrow key navigation between segments
    if (event.key === 'ArrowLeft') {
      const position = inputReference.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (segment === 'minute' && bounds['minute'] && position === bounds['minute'].start) {
          event.preventDefault()
          selectSegment('hour')
        }
      }
    } else if (event.key === 'ArrowRight') {
      const position = inputReference.current?.selectionStart
      if (typeof position === 'number') {
        const segment = getSegmentFromPosition(
          position,
          inputValue,
          config.delimiter,
          config.segments,
        )
        if (segment === 'hour' && bounds['hour'] && position === bounds['hour'].end) {
          event.preventDefault()
          selectSegment('minute')
        }
      }
    }
  }

  // Handle blur
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
    const relatedTarget = event.relatedTarget as HTMLElement
    if (relatedTarget?.tagName === 'BUTTON' && relatedTarget.tabIndex === -1) {
      return
    }
    setSelectedSegment(null)

    const minutes = parseDuration(inputValue)
    if (minutes === null) {
      setInputValue(durationString)
    } else {
      setInputValue(formatDuration(minutes))
    }
  }

  // Handle focus
  const handleFocus = (): void => {
    if (inputValue === config.placeholder) {
      setInputValue('')
    } else if (inputValue && !focusFromArrowReference.current && !focusFromMouseReference.current) {
      setTimeout(() => selectSegment('hour'), 0)
    }
    focusFromArrowReference.current = false
    focusFromMouseReference.current = false
  }

  // Handle arrow button clicks
  const handleArrowClick = (direction: 'down' | 'up') => {
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
    const newMinutes = durationMinutes + baseIncrement * incrementAmount

    if (newMinutes >= 0) {
      updateDuration(newMinutes)
      const formatted = formatDuration(newMinutes)
      setInputValue(formatted)

      focusFromArrowReference.current = true

      setTimeout(() => {
        if (inputReference.current && !inputReference.current.matches(':focus')) {
          inputReference.current.focus()
        }
        selectSegment(targetSegment)
      }, 10)
    }
  }

  return (
    <SegmentedInputWrapper
      hasSelection={!!selectedSegment}
      label={t('formats.durationFormat', { defaultValue: 'HH:MM' })}
      onArrowClick={handleArrowClick}>
      <Input
        className={`selection:bg-secondary selection:text-secondary-content join-item m-0 font-mono ${error ? 'text-error' : ''}`}
        fullWidth={false}
        id={id}
        onBlur={handleBlur}
        onChange={handleInputChange}
        onClick={handleClick}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        placeholder={t('formats.durationFormat', {
          defaultValue: 'HH:MM',
        })}
        ref={inputReference}
        size="md"
        style={{ fontSize: '0.95rem', width: 'calc(5ch + 1.6rem)' }}
        type="text"
        value={inputValue}
        variant={error ? 'error' : 'default'}
      />
    </SegmentedInputWrapper>
  )
}
